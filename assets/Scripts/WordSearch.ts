import { _decorator, Color, Component, EventTouch, Input, input, instantiate, Label, Node, Prefab, Sprite, UITransform, Vec3, Graphics, tween, v3 } from 'cc';
import { GameManager } from './GameManager';
import { UIControler } from './UIControler';
const { ccclass, property } = _decorator;

/**
 * Class WordSearch - Core xử lý game Word Search
 * 
 * Tính năng chính:
 * - Hiển thị lưới 10x10 với các ký tự từ data mẫu
 * - Xử lý tương tác kéo thả của người chơi
 * - Bôi màu các ô được chọn theo hướng kéo
 * - Hỗ trợ kéo theo 8 hướng: ngang, dọc, chéo
 */

interface UsedFeatures {
    hints: Set<number>;
    sounds: Set<number>;
}

interface GridCell {
    node: Node;
    letter: string;
}

@ccclass('WordSearch')
export class WordSearch extends Component {
    public static Instance: WordSearch;
    @property({ readonly: true, editorOnly: true, serializable: false })
    private HEADER_UI: string = "========== UI ELEMENTS ==========";
    @property({ type: Label, tooltip: "Label hiển thị thời gian" })
    public timeLabel: Label = null;
    @property({ type: Label, tooltip: "Label hiển thị điểm số" })
    public scoreLabel: Label = null;

    @property({ readonly: true, editorOnly: true, serializable: false })
    private GRID: string = "========== GRID ELEMENTS ==========";
    @property({ type: Node, tooltip: "Node chứa toàn bộ lưới ô" })
    public wordGrid: Node = null;
    @property({ type: Prefab, tooltip: "Các ô trong lưới" })
    public letterCell: Prefab = null;
    @property({ type: Node, tooltip: "Node chứa các đường kéo" })
    public selectionLines: Node = null;

    @property({ readonly: true, editorOnly: true, serializable: false })
    private GAMEPLAY: string = "========= GAMEPLAY ELEMENTS ==========";
    @property({ type: Label, tooltip: "Câu gợi ý" })
    public hintLabel: Label = null;
    @property({ type: Node, tooltip: "Các câu trả lời" })
    public answerList: Node = null;
    @property({ type: Node, tooltip: "Node chứa các gợi ý từ khoá" })
    public itemShowKeyList: Node = null;
    @property({ type: Node, tooltip: "Màn chờ lúc chạy hiệu ứng" })
    public waitMask: Node = null;

    // Game State
    private grid: GridCell[][] = [];
    private selectedCells: GridCell[] = [];
    private wordAnswers: string[] = [];
    private discoveredWords: boolean[] = [];
    private timeInterval: number = null;
    private usedFeatures: UsedFeatures = {
        hints: new Set<number>(),
        sounds: new Set<number>()
    };

    public remainingTime: number = 0;
    public currentScore: number = 0;

    // Touch State
    private touchStartRow: number = -1;
    private touchStartCol: number = -1;
    private selectionDirection: string = null;
    private touchStartPosition: Vec3 = null;
    private selectionStep = 0;
    private activeSelectionLine: Node = null;
    private _eventListenersInitialized = false;


    onLoad() {
        WordSearch.Instance = this;
        speechSynthesis.getVoices();
    }

    protected onDisable(): void {
        this.resetGameState();
    }

    initGame() {
        this.resetGameState();
        this.initializeData();
        this.setupUI();
        this.registerEvents();
        this.startTimer();
    }



    //=============== BỘ DATA ĐẦU GẢME ===============//
    /**
     * Reset toàn bộ trạng thái game về mặc định
     * - Xóa timer và sự kiện
     * - Reset các biến trạng thái
     * - Reset giao diện
     */
    private resetGameState() {
        // Xóa timer và sự kiện
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
        this.unregisterEvents();

        // Reset các biến trạng thái
        this.grid = [];
        this.selectedCells = [];
        this.wordAnswers = [];
        this.discoveredWords = [];
        this.remainingTime = 0;
        this.currentScore = 0;
        this.touchStartRow = -1;
        this.touchStartCol = -1;
        this.selectionDirection = null;
        this.touchStartPosition = null;
        this.selectionStep = 0;
        this.activeSelectionLine = null;
        this.waitMask.active = false;
        this._eventListenersInitialized = false;

        this.usedFeatures = {
            hints: new Set<number>(),
            sounds: new Set<number>()
        };

        // Reset giao diện
        if (this.wordGrid) this.wordGrid.removeAllChildren();
        if (this.selectionLines) this.selectionLines.children.forEach(line => line.active = false);
        if (this.itemShowKeyList) this.itemShowKeyList.children.forEach(button => button.active = true);
        if (this.answerList) this.answerList.children.forEach(child => {
            const label = child.getChildByPath('Label')?.getComponent(Label);
            if (label) label.string = '';
        });

        if (this.timeLabel) this.timeLabel.string = '0s';
        if (this.scoreLabel) this.scoreLabel.string = '0';
        if (this.hintLabel) this.hintLabel.string = '';

    }

    /**
     * Khởi tạo dữ liệu game từ GameManager
     */
    private initializeData() {
        this.wordAnswers = [...GameManager.data.answers];
        this.discoveredWords = new Array(this.wordAnswers.length).fill(false);
        this.remainingTime = GameManager.timeLimit;
        this.currentScore = GameManager.initScore;
        this.updateScoreDisplay();
        this.updateTimeDisplay();
    }

    /**
     * Thiết lập giao diện game
     */
    private setupUI() {
        this.wordGrid.removeAllChildren();
        this.selectionLines.children.forEach(line => line.active = false);
        this.itemShowKeyList.children.forEach(button => button.active = true);
        this.initializeWordGrid();
        this.initializeAnswerDisplay();
    }

    /**
     * Đăng ký các sự kiện touch
     */
    private registerEvents() {
        if (!this._eventListenersInitialized) {
            input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
            input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
            this._eventListenersInitialized = true;
        }
    }

    /**
    * Hủy đăng ký sự kiện touch
    */
    private unregisterEvents() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /**
     * Bắt đầu đếm thời gian
     */
    private startTimer() {
        this.timeInterval = setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
                this.updateTimeDisplay();
            } else {
                this.endGame();
            }
        }, 1000);
    }




    //=============== KHỞI TẠO GIAO DIỆN ===============//
    /**
     * Khởi tạo lưới game
     * - Tạo các ô với ký tự từ data mẫu
     * - Thiết lập vị trí và style cho từng ô
     */
    private initializeWordGrid() {
        this.grid = GameManager.data.matrixKey.map(row => row.map(letter => ({
            node: instantiate(this.letterCell),
            letter: letter
        })));
        const cellSize = this.getCellSize();

        for (let i = 0; i < this.grid.length; i++) {
            for (let j = 0; j < this.grid[i].length; j++) {
                let cellNode = this.grid[i][j].node;
                let label = cellNode.getChildByPath(`Label`).getComponent(Label);
                label.string = this.grid[i][j].letter;

                const offset = (this.grid.length * cellSize) / 2 - cellSize / 2;

                cellNode.name = `${cellNode.name}_${i}_${j}`;
                cellNode.parent = this.wordGrid;
                cellNode.setPosition(j * cellSize - offset, offset - i * cellSize);
                cellNode[`Key`] = this.grid[i][j].letter;
            }
        }
    }

    /**
     * Khởi tạo các câu trả lời
     * - Tạo các node con chứa câu trả lời từ data mẫu
     * - Gán label và thuộc tính Answer cho từng node
     */
    private initializeAnswerDisplay() {
        for (let i = 0; i < this.wordAnswers.length; i++) {
            let label = this.answerList.children[i].getChildByPath(`Label`).getComponent(Label);
            label.string = this.convertToUnderscore(this.wordAnswers[i]);
        }
    }




    //=============== XỬ LÝ TƯƠNG TÁC NGƯỜI DÙNG ===============//
    /**
     * Xử lý khi người chơi bắt đầu chạm
     * - Lưu vị trí bắt đầu
     * - Bôi màu ô đầu tiên
     */
    onTouchStart(event: EventTouch) {
        let touchPos = event.getUILocation();
        let [row, col] = this.getGridCellAtPosition(new Vec3(touchPos.x, touchPos.y, 0));
        if (row >= 0 && col >= 0) {
            this.touchStartRow = row;
            this.touchStartCol = col;
            this.touchStartPosition = this.grid[row][col].node.getWorldPosition();

            this.activeSelectionLine = this.getUnusedSelectionLine();
            if (this.activeSelectionLine) {
                this.activeSelectionLine.setWorldPosition(this.touchStartPosition);
                this.selectionDirection = null;
            }
        }
    }

    /**
     * Xử lý khi người chơi kéo
     * - Xác định hướng kéo
     * - Vẽ đường kéo
     */
    onTouchMove(event: EventTouch) {
        if (this.touchStartRow < 0 || !this.activeSelectionLine) return;

        let touchPos = event.getUILocation();
        let currentPos = new Vec3(touchPos.x, touchPos.y, 0);

        let [row, col] = this.getGridCellAtPosition(currentPos);
        if (row < 0 || col < 0) return;

        let dx = col - this.touchStartCol;
        let dy = row - this.touchStartRow;
        let angle = 0;

        const cellSize = this.getCellSize();
        let lineLength = 0;

        this.selectionStep = Math.max(Math.abs(dx), Math.abs(dy));

        if (dx === 0 || dy === 0) {
            lineLength = this.selectionStep * cellSize + cellSize * 2 / 3;
        } else if (Math.abs(dx) === Math.abs(dy)) {
            lineLength = Math.sqrt(2) * this.selectionStep * cellSize + cellSize * 2 / 3;
        } else {
            return;
        }

        let endpos = this.grid[row][col].node.getWorldPosition();
        let midPos = new Vec3(
            (this.touchStartPosition.x + endpos.x) / 2,
            (this.touchStartPosition.y + endpos.y) / 2,
            0
        );
        this.activeSelectionLine.setWorldPosition(midPos);

        if (dx === 0 && dy < 0) { this.selectionDirection = 'vertical-up'; angle = 90; }
        else if (dx === 0 && dy > 0) { this.selectionDirection = 'vertical-down'; angle = -90; }
        else if (dy === 0 && dx > 0) { this.selectionDirection = 'horizontal-right'; angle = 0; }
        else if (dy === 0 && dx < 0) { this.selectionDirection = 'horizontal-left'; angle = 180; }
        else if (dx > 0 && dy < 0) { this.selectionDirection = 'diagonal-up-right'; angle = 45; }
        else if (dx < 0 && dy < 0) { this.selectionDirection = 'diagonal-up-left'; angle = 135; }
        else if (dx > 0 && dy > 0) { this.selectionDirection = 'diagonal-down-right'; angle = -45; }
        else if (dx < 0 && dy > 0) { this.selectionDirection = 'diagonal-down-left'; angle = -135; }

        this.updateSelectionLine(this.activeSelectionLine, lineLength, angle);
    }

    /**
     * Xử lý khi người chơi thả tay
     * - Reset trạng thái chọn
     * - Xóa màu highlight và đường kéo
     */
    onTouchEnd(event: EventTouch) {
        this.selectedCells = [];
        if (this.selectionDirection) {
            switch (this.selectionDirection) {
                case 'vertical-up':
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow - i;
                        this.selectedCells.push(this.grid[r][this.touchStartCol]);
                    }
                    break;
                case 'vertical-down':
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow + i;
                        this.selectedCells.push(this.grid[r][this.touchStartCol]);
                    }
                    break;
                case 'horizontal-right':
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let c = this.touchStartCol + i;
                        this.selectedCells.push(this.grid[this.touchStartRow][c]);
                    }
                    break;
                case 'horizontal-left':
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let c = this.touchStartCol - i;
                        this.selectedCells.push(this.grid[this.touchStartRow][c]);
                    }
                    break;
                case 'diagonal-up-right':
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow - i;
                        let c = this.touchStartCol + i;
                        this.selectedCells.push(this.grid[r][c]);
                    }
                    break;
                case 'diagonal-up-left':
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow - i;
                        let c = this.touchStartCol - i;
                        this.selectedCells.push(this.grid[r][c]);
                    }
                    break;
                case 'diagonal-down-right':
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow + i;
                        let c = this.touchStartCol + i;
                        this.selectedCells.push(this.grid[r][c]);
                    }
                    break;
                case 'diagonal-down-left':
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow + i;
                        let c = this.touchStartCol - i;
                        this.selectedCells.push(this.grid[r][c]);
                    }
                    break;
            }
        }
        if (this.activeSelectionLine) {
            this.activeSelectionLine.active = false;
        }
        this.checkSelectedWord();
        this.activeSelectionLine = null;
        this.resetEventTouch();
    }

    /**
     * Reset lại game từ đầu
     */
    public resetGame(): void {
        this.initGame();
    }

    /**
     * Thoát game và hiển thị popup xác nhận
     */
    public onOutGame(): void {
        UIControler.instance.onOpen(null, 'out', this.currentScore);
    }




    //=============== XỬ LÝ LOGIC GAME ===============//
    /**
     * Cập nhật hiển thị thời gian
     */
    private updateTimeDisplay() {
        this.timeLabel.string = `${this.remainingTime}s`;
    }

    /**
     * Cập nhật hiển thị điểm số
     */
    private updateScoreDisplay() {
        this.scoreLabel.string = `${this.currentScore}`;
    }

    /**
     * Cập nhật điểm khi tìm thấy từ
     */
    private updateScore(number) {
        const newScore = this.currentScore + number;
        this.currentScore = newScore >= 0 ? newScore : 0;
        this.updateScoreDisplay();
        this.showBonusEffect(number);

        if (this.currentScore <= 0) {
            this.endGame();
        }
    }
    /**
     * Kiểm tra từ vừa kéo có khớp với đáp án không và cập nhật UI
     */
    checkSelectedWord(): void {
        if (!this.selectedCells.length) return;

        let forwardWord = '';
        for (let cell of this.selectedCells) {
            forwardWord += cell.letter;
        }

        let backwardWord = '';
        for (let i = this.selectedCells.length - 1; i >= 0; i--) {
            backwardWord += this.selectedCells[i].letter;
        }

        const formattedAnswers = this.wordAnswers.map(answer =>
            answer.toUpperCase().replace(/\s/g, '')
        );

        for (let i = 0; i < formattedAnswers.length; i++) {
            if (this.discoveredWords[i]) continue;

            if (formattedAnswers[i] === forwardWord || formattedAnswers[i] === backwardWord) {
                this.activeSelectionLine.active = true;

                this.discoveredWords[i] = true;
                this.updateScore(GameManager.bonusScore);

                this.showWordMoveEffect(this.selectedCells, i, () => {
                    if (this.discoveredWords.every(found => found)) {
                        this.endGame();
                    }
                });

                break;
            }
        }
    }



    
    //=============== XỬ LÝ ITEM HỖI TRỢ ===============//
    /**
     * Hiển thị một gợi ý ngẫu nhiên cho từ chưa được tìm thấy
     */
    public onShowRandomHint() {
        const availableHints = GameManager.data.hints.filter((_, index) => {
            return !this.discoveredWords[index];
        });
        if (availableHints.length === 0) return;

        const randomIndex = Math.floor(Math.random() * availableHints.length);
        const hintIndex = GameManager.data.hints.indexOf(availableHints[randomIndex]);

        if (!this.usedFeatures.hints.has(hintIndex)) {
            this.updateScore(GameManager.hintScore);
            this.usedFeatures.hints.add(hintIndex);
        }

        this.hintLabel.string = availableHints[randomIndex];
    }

    /**
     * Mở một chữ cái ngẫu nhiên trong đáp án được chọn
     * @param answerIndex Vị trí của đáp án cần mở gợi ý
     */
    public onShowRandomLetter(e, answerIndex: number) {
        if (this.discoveredWords[answerIndex]) return;

        const answer = this.wordAnswers[answerIndex];
        const currentLabel = this.answerList.children[answerIndex].getChildByPath('Label').getComponent(Label);
        const currentText = currentLabel.string.split(' ');

        const hiddenIndices = [];
        for (let i = 0; i < currentText.length; i++) {
            if (currentText[i] === '-') hiddenIndices.push(i);
        }

        if (hiddenIndices.length === 0) return;

        const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
        currentText[randomIndex] = answer[randomIndex];

        currentLabel.string = currentText.join(' ');

        const caller = this.itemShowKeyList.children[answerIndex];
        if (caller) caller.active = false;

        this.updateScore(GameManager.letterScore);
    }

    /**
     * Đọc đáp án trong ô chữ
     */
    onReadLetter(e, answerIndex: number) {
        if (this.discoveredWords[answerIndex]) return;

        if (!this.usedFeatures.sounds.has(answerIndex)) {
            this.updateScore(GameManager.readScore);
            this.usedFeatures.sounds.add(answerIndex);
        }

        const answer = this.wordAnswers[answerIndex];
        this.onReadWord(answer);
    }

    /**
     * Dùng API Google để đọc text
     */
    onReadWord(txt: string) {
        if (window.speechSynthesis) {
            const msg = new SpeechSynthesisUtterance(txt);
            msg.voice = speechSynthesis.getVoices()[6];
            msg.lang = 'en-US';
            msg.volume = 1;
            msg.rate = 0.8;
            msg.pitch = 1;
            window.speechSynthesis.speak(msg);
        } else {
            console.error("SpeechSynthesis không được hỗ trợ trên nền tảng này!");
        }
    }




    //=============== XỬ LÝ HIỆU ỨNG HOẠT ẢNH ===============//
    /**
     * Hiệu ứng cộng điểm
     */
    private showBonusEffect(bonus: number, target?: Node) {
        const OFFSET_Y1 = 80;
        const OFFSET_Y2 = 40;
        const startPos = target ? target.getWorldPosition().clone() : this.scoreLabel.node.getWorldPosition().clone();

        const initPos = bonus >= 0 ? startPos.clone().add(v3(0, -OFFSET_Y1, 0)) : startPos.clone().add(v3(0, -OFFSET_Y2, 0));
        const targetPos = startPos.clone().add(v3(0, bonus >= 0 ? -OFFSET_Y2 : -OFFSET_Y1, 0));

        const bonusNode = new Node("BonusEffect");
        bonusNode.parent = this.node;
        bonusNode.setWorldPosition(initPos);

        const bonusLabel = bonusNode.addComponent(Label);
        bonusLabel.string = bonus >= 0 ? `+${bonus}` : `${bonus}`;
        bonusLabel.color = bonus >= 0 ? new Color(0, 255, 0) : new Color(255, 0, 0);
        bonusLabel.fontSize = 40;
        bonusLabel.lineHeight = 50;
        bonusLabel.isBold = true;
        bonusLabel.enableOutline = true;
        bonusLabel.outlineColor = new Color(255, 255, 255);
        bonusLabel.enableShadow = true;
        bonusLabel.shadowColor = new Color(56, 56, 56);

        tween(bonusNode)
            .to(0.8, { worldPosition: targetPos })
            .call(() => {
                bonusNode.destroy();
            })
            .start();
    }

    /**
     * Hiệu ứng chữ di chuyển từ ô chữ xuống ô đáp án
     */
    private showWordMoveEffect(selectedCells: GridCell[], answerIndex: number, cb: Function): void {
        const answerNode = this.answerList.children[answerIndex];
        const answerLabel = answerNode.getChildByPath('Label').getComponent(Label);
        const targetPos = answerLabel.node.getWorldPosition();

        this.waitMask.active = true;

        selectedCells.forEach((cell, index) => {
            const letterNode = new Node("MovingLetter");
            letterNode.parent = this.node;
            letterNode.setWorldPosition(cell.node.getWorldPosition());

            const letterLabel = letterNode.addComponent(Label);
            letterLabel.string = cell.letter;
            letterLabel.fontSize = 60;
            letterLabel.lineHeight = 80;
            letterLabel.isBold = true;
            letterLabel.enableOutline = true;
            letterLabel.outlineColor = new Color(0, 0, 0);
            letterLabel.enableShadow = true;
            letterLabel.shadowColor = new Color(56, 56, 56);

            const targetX = targetPos.x + (index - selectedCells.length / 2) * 45;
            const targetY = targetPos.y;

            tween(letterNode)
                .delay(index * 0.1)
                .to(0.5, {
                    worldPosition: new Vec3(targetX, targetY, 0),
                    scale: new Vec3(1.2, 1.2, 1.2)
                })
                .to(0.2, {
                    scale: new Vec3(1, 1, 1)
                })
                .call(() => {
                    if (index === selectedCells.length - 1) {
                        answerLabel.string = this.wordAnswers[answerIndex];
                        this.node.children.forEach(child => {
                            if (child.name === "MovingLetter") {
                                child.destroy();
                            }
                        });

                        this.waitMask.active = false;
                        cb();
                    }
                })
                .start();
        });
    }

    //=============== XỬ LÝ KẾT THÚC GAME ===============//
    /**
     * Kết thúc game
     */
    private endGame(): void {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }

        this.unregisterEvents();

        this.itemShowKeyList.children.forEach(button => button.active = false);

        if (this.activeSelectionLine) {
            this.activeSelectionLine.active = false;
        }

        UIControler.instance.onOpen(null, 'over', this.currentScore);
    }




    //=============== CÁC HÀM TIỆN ÍCH ===============//
    /**
     * Lấy kích thước của ô
     * @returns Kích thước của ô
     */
    private getCellSize(): number {
        const cellBackground = this.letterCell.data.getChildByPath('bg');
        return cellBackground ? cellBackground.getComponent(UITransform).contentSize.width : 50;
    }

    /**
     * Chuyển đổi tọa độ touch thành vị trí ô trong lưới
     * @param pos Tọa độ touch
     * @returns Vị trí [hàng, cột] trong lưới
     */
    private getGridCellAtPosition(pos: Vec3): [number, number] {
        const cellSize = this.getCellSize();
        let localPos = this.wordGrid.getComponent(UITransform).convertToNodeSpaceAR(pos);
        let col = Math.floor((localPos.x + (this.grid.length * cellSize) / 2) / cellSize);
        let row = Math.floor((-localPos.y + (this.grid.length * cellSize) / 2) / cellSize);

        if (row >= 0 && row < 10 && col >= 0 && col < 10) return [row, col];

        return [-1, -1];
    }

    /**
     * Thay đổi thông số dragLine
     */
    private updateSelectionLine(line: Node, length: number, angle: number) {
        line.getComponent(UITransform).setContentSize(length, 60);
        line.angle = angle;
    }

    /**
     * Lấy một dragLine chưa được sử dụng
     */
    private getUnusedSelectionLine(): Node {
        for (const line of this.selectionLines.children) {
            if (!line.active) {
                line.active = true;
                line.getComponent(UITransform).setContentSize(0, 50);
                line.angle = 0;
                return line;
            }
        }
        return null;
    }

    /**
     * Reset toàn bộ trạng thái
     */
    private resetEventTouch() {
        this.selectedCells = [];
        this.touchStartRow = -1;
        this.touchStartCol = -1;
        this.selectionDirection = null;
        this.touchStartPosition = null;
    }

    /**
     * Chuyển đổi chuỗi đầu vào thành chuỗi gạch dưới
     * @param input Chuỗi đầu vào cần chuyển đổi
     * @returns Chuỗi gạch dưới tương ứng
     */
    private convertToUnderscore(input: string): string {
        let output = '';
        for (const char of input) {
            if (char === ' ') {
                output += '  ';
            } else {
                output += '- ';
            }
        }
        return output.trim();
    }
}
