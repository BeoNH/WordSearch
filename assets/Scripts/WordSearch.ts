import { _decorator, Color, Component, EventTouch, Input, input, instantiate, Label, Node, Prefab, Sprite, UITransform, Vec3, Graphics } from 'cc';
import { GameManager } from './GameManager';
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
    private TOP: string = "========== TOP ==========";

    // UI Components
    @property({ type: Node, tooltip: "Node chứa toàn bộ lưới ô" })
    public wordGrid: Node = null;
    @property({ type: Prefab, tooltip: "Các ô trong lưới" })
    public letterCell: Prefab = null;
    @property({ type: Node, tooltip: "Node chứa các đường kéo" })
    public selectionLines: Node = null;
    @property({ type: Label, tooltip: "Câu gợi ý" })
    public hintLabel: Label = null;
    @property({ type: Node, tooltip: "Các câu trả lời" })
    public answerList: Node = null;
    @property({ type: Node, tooltip: "Node chứa các gợi ý từ khoá" })
    public itemShowKeyList: Node = null;
    @property({ type: Label, tooltip: "Label hiển thị thời gian" })
    public timeLabel: Label = null;
    @property({ type: Label, tooltip: "Label hiển thị điểm số" })
    public scoreLabel: Label = null;

    // Game State
    private grid: GridCell[][] = [];
    private selectedCells: GridCell[] = [];
    private wordAnswers: string[] = [];
    private discoveredWords: boolean[] = [];
    private remainingTime: number = 0;
    private currentScore: number = 0;
    private timeInterval: number = null;
    private usedFeatures: UsedFeatures = {
        hints: new Set<number>(),
        sounds: new Set<number>()
    };

    // Touch State
    private touchStartRow: number = -1;
    private touchStartCol: number = -1;
    private selectionDirection: string = null;
    private touchStartPosition: Vec3 = null;
    private selectionStep = 0;
    private activeSelectionLine: Node = null;
    private _eventListenersInitialized = false;

    // Lifecycle Methods
    onLoad() {
        WordSearch.Instance = this;
        speechSynthesis.getVoices();
        this.initGame();
    }

    onDestroy() {
        this.unregisterEvents();
    }

    // Initialization Methods
    initGame() {
        this.resetGameState();
        this.initializeData();
        this.setupUI();
        this.registerEvents();
        this.startTimer();
    }

    private resetGameState() {
        this.grid = [];
        this.selectedCells = [];
        this.touchStartRow = -1;
        this.touchStartCol = -1;
        this.selectionDirection = null;
        this.touchStartPosition = null;
        this.selectionStep = 0;
        this.usedFeatures.hints.clear();
        this.usedFeatures.sounds.clear();
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }

    /**
     * Khởi tạo dữ liệu game
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
     * Đăng ký sự kiện touch
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

    // Button Actions
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
        
        // Cập nhật điểm nếu là lần đầu sử dụng gợi ý này
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
        // Kiểm tra nếu đáp án đã được tìm thấy
        if (this.discoveredWords[answerIndex]) return;

        const answer = this.wordAnswers[answerIndex];
        const currentLabel = this.answerList.children[answerIndex].getChildByPath('Label').getComponent(Label);
        const currentText = currentLabel.string.split(' ');

        // Tìm các vị trí chưa được mở
        const hiddenIndices = [];
        for (let i = 0; i < currentText.length; i++) {
            if (currentText[i] === '-') hiddenIndices.push(i);
        }

        if (hiddenIndices.length === 0) return;

        // Chọn ngẫu nhiên một vị trí để mở
        const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
        currentText[randomIndex] = answer[randomIndex];

        // Cập nhật label
        currentLabel.string = currentText.join(' ');

        // Ẩn item gợi ý đã sử dụng
        const caller = this.itemShowKeyList.children[answerIndex];
        if (caller) caller.active = false;

        this.updateScore(GameManager.letterScore);
    }

    /**
     * Đọc đáp án trong ô chữ
     */
    onReadLetter(e, answerIndex: number) {
        if (this.discoveredWords[answerIndex]) return;

        // Cập nhật điểm nếu là lần đầu đọc từ này
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
            msg.voice = speechSynthesis.getVoices()[6]; // Giọng đọc
            msg.lang = 'en-US'; // Ngôn ngữ tiếng Anh
            msg.volume = 1; // Âm lượng (0-1)
            msg.rate = 0.8; // Tốc độ đọc (0.1-10)
            msg.pitch = 1; // Độ cao giọng (0-2)
            window.speechSynthesis.speak(msg);
        } else {
            console.error("SpeechSynthesis không được hỗ trợ trên nền tảng này!");
        }
    }

    /**
     * Khởi tạo lưới game
     * - Tạo các ô với ký tự từ data mẫu
     * - Thiết lập vị trí và style cho từng ô
     */
    initializeWordGrid() {
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
    initializeAnswerDisplay() {
        for (let i = 0; i < this.wordAnswers.length; i++) {
            let label = this.answerList.children[i].getChildByPath(`Label`).getComponent(Label);
            label.string = this.convertToUnderscore(this.wordAnswers[i]);
        }
    }

    /**
     * Chuyển đổi chuỗi đầu vào thành chuỗi gạch dưới
     * @param input Chuỗi đầu vào cần chuyển đổi
     * @returns Chuỗi gạch dưới tương ứng
     */
    convertToUnderscore(input: string): string {
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
            lineLength = this.selectionStep * cellSize + cellSize;
        } else if (Math.abs(dx) === Math.abs(dy)) {
            lineLength = Math.sqrt(2) * this.selectionStep * cellSize + cellSize;
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

        if (dx === 0 && dy < 0) { this.selectionDirection = 'vertical-up'; angle = 90; } // Kéo lên theo chiều dọc
        else if (dx === 0 && dy > 0) { this.selectionDirection = 'vertical-down'; angle = -90; } // Kéo xuống theo chiều dọc
        else if (dy === 0 && dx > 0) { this.selectionDirection = 'horizontal-right'; angle = 0; } // Kéo phải theo chiều ngang
        else if (dy === 0 && dx < 0) { this.selectionDirection = 'horizontal-left'; angle = 180; } // Kéo trái theo chiều ngang
        else if (dx > 0 && dy < 0) { this.selectionDirection = 'diagonal-up-right'; angle = 45; } // Kéo chéo lên phải
        else if (dx < 0 && dy < 0) { this.selectionDirection = 'diagonal-up-left'; angle = 135; } // Kéo chéo lên trái
        else if (dx > 0 && dy > 0) { this.selectionDirection = 'diagonal-down-right'; angle = -45; } // Kéo chéo xuống phải
        else if (dx < 0 && dy > 0) { this.selectionDirection = 'diagonal-down-left'; angle = -135; } // Kéo chéo xuống trái
        console.log(dx, dy, this.selectionDirection);

        this.updateSelectionLine(this.activeSelectionLine, lineLength, angle);
    }

    /**
     * Xử lý khi người chơi thả tay
     * - Reset trạng thái chọn
     * - Xóa màu highlight và đường kéo
     */
    onTouchEnd(event: EventTouch) {
        // Chọn các ô
        this.selectedCells = [];
        if (this.selectionDirection) {
            switch (this.selectionDirection) {
                case 'vertical-up':
                    // Kéo lên theo chiều dọc: giảm hàng, cột không đổi
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow - i;
                        this.selectedCells.push(this.grid[r][this.touchStartCol]);
                    }
                    break;
                case 'vertical-down':
                    // Kéo xuống theo chiều dọc: tăng hàng, cột không đổi
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow + i;
                        this.selectedCells.push(this.grid[r][this.touchStartCol]);
                    }
                    break;
                case 'horizontal-right':
                    // Kéo phải theo chiều ngang: tăng cột, hàng không đổi
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let c = this.touchStartCol + i;
                        this.selectedCells.push(this.grid[this.touchStartRow][c]);
                    }
                    break;
                case 'horizontal-left':
                    // Kéo trái theo chiều ngang: giảm cột, hàng không đổi
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let c = this.touchStartCol - i;
                        this.selectedCells.push(this.grid[this.touchStartRow][c]);
                    }
                    break;
                case 'diagonal-up-right':
                    // Kéo chéo lên phải: giảm hàng, tăng cột
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow - i;
                        let c = this.touchStartCol + i;
                        this.selectedCells.push(this.grid[r][c]);
                    }
                    break;
                case 'diagonal-up-left':
                    // Kéo chéo lên trái: giảm hàng, giảm cột
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow - i;
                        let c = this.touchStartCol - i;
                        this.selectedCells.push(this.grid[r][c]);
                    }
                    break;
                case 'diagonal-down-right':
                    // Kéo chéo xuống phải: tăng hàng, tăng cột
                    for (let i = 0; i <= this.selectionStep; i++) {
                        let r = this.touchStartRow + i;
                        let c = this.touchStartCol + i;
                        this.selectedCells.push(this.grid[r][c]);
                    }
                    break;
                case 'diagonal-down-left':
                    // Kéo chéo xuống trái: tăng hàng, giảm cột
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
        this.resetAll();
    }

    /**
     * Kiểm tra từ vừa kéo có khớp với đáp án không và cập nhật UI
     */
    checkSelectedWord(): void {
        if (!this.selectedCells.length) return;

        // Ghép từ theo chiều xuôi
        let forwardWord = '';
        for (let cell of this.selectedCells) {
            forwardWord += cell.letter;
        }

        // Ghép từ theo chiều ngược
        let backwardWord = '';
        for (let i = this.selectedCells.length - 1; i >= 0; i--) {
            backwardWord += this.selectedCells[i].letter;
        }

        // Format đáp án sang chữ hoa và bỏ dấu cách
        const formattedAnswers = this.wordAnswers.map(answer =>
            answer.toUpperCase().replace(/\s/g, '')
        );

        // Kiểm tra đáp án
        for (let i = 0; i < formattedAnswers.length; i++) {
            if (this.discoveredWords[i]) continue;

            if (formattedAnswers[i] === forwardWord || formattedAnswers[i] === backwardWord) {
                const answerLabel = this.answerList.children[i].getChildByPath('Label').getComponent(Label);
                answerLabel.string = this.wordAnswers[i];

                this.activeSelectionLine.active = true;
                
                // Đánh dấu đã tìm thấy và cập nhật điểm
                this.discoveredWords[i] = true;
                this.updateScore(GameManager.bonusScore);
                break;
            }
        }
    }

    /**
     * Reset toàn bộ trạng thái
     */
    resetAll() {
        this.selectedCells = [];
        this.touchStartRow = -1;
        this.touchStartCol = -1;
        this.selectionDirection = null;
        this.touchStartPosition = null;
    }

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
    getGridCellAtPosition(pos: Vec3): [number, number] {
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
    updateSelectionLine(line: Node, length: number, angle: number) {
        line.getComponent(UITransform).setContentSize(length, 50);
        line.angle = angle;
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

        // Kết thúc game nếu điểm về 0
        if (this.currentScore <= 0) {
            this.endGame();
        }
    }

    /**
     * Kết thúc game
     */
    private endGame() {
        
        // Hủy timer
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }

        // Vô hiệu hóa tương tác
        this.unregisterEvents();
        
        // Ẩn các nút gợi ý và chữ cái
        this.itemShowKeyList.children.forEach(button => button.active = false);
        
        // Ẩn đường kéo đang hiển thị nếu có
        if (this.activeSelectionLine) {
            this.activeSelectionLine.active = false;
        }

        console.log(`Game Over! Final Score: ${this.currentScore}`);
        // TODO: Thêm logic kết thúc game ở đây
    }
}
