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
@ccclass('WordSearch')
export class WordSearch extends Component {
    public static Instance: WordSearch;

    @property({ readonly: true, editorOnly: true, serializable: false })
    private TOP: string = "========== TOP ==========";
    @property({ type: Node, tooltip: "Node chứa toàn bộ lưới ô" })
    public gridNode: Node = null;
    @property({ type: Prefab, tooltip: "Các ô trong lưới" })
    public cellNode: Prefab = null;
    @property({ type: Node, tooltip: "Node vẽ đường kéo" })
    public dragLine: Node = null;

    /** Mảng 2 chiều lưu các ký tự của lưới */
    private grid: string[][] = [];
    /** Mảng 2 chiều lưu các Node của từng ô trong lưới */
    private cellNodes: Node[][] = [];
    /** Danh sách các ô đang được chọn */
    private selectedCells: Node[] = [];
    /** Vị trí hàng bắt đầu kéo */
    private startRow: number = -1;
    /** Vị trí cột bắt đầu kéo */
    private startCol: number = -1;
    /** Hướng kéo hiện tại */
    private direction: string = null;
    /** Vị trí bắt đầu kéo */
    private startPos: Vec3 = null;
    /** Số ô được kéo */
    private stepNode = 0;

    onLoad() {
        WordSearch.Instance = this;

        this.initGrid();
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        // input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /**
     * Khởi tạo lưới game
     * - Tạo các ô với ký tự từ data mẫu
     * - Thiết lập vị trí và style cho từng ô
     */
    initGrid() {
        this.grid = GameManager.data.matrixKey;
        const bgSize = this.getBgSize();

        for (let i = 0; i < this.grid.length; i++) {
            this.cellNodes[i] = [];
            for (let j = 0; j < this.grid[i].length; j++) {
                let cellNode = instantiate(this.cellNode);
                let label = cellNode.getChildByPath(`Label`).getComponent(Label);
                label.string = this.grid[i][j];


                const offset = (this.grid.length * bgSize) / 2 - bgSize / 2;

                cellNode.name = `${cellNode.name}_${i}_${j}`;
                cellNode.parent = this.gridNode;
                cellNode.setPosition(j * bgSize - offset, offset - i * bgSize);
                this.cellNodes[i][j] = cellNode;
            }
        }
    }

    /**
     * Xử lý khi người chơi bắt đầu chạm
     * - Lưu vị trí bắt đầu
     * - Bôi màu ô đầu tiên
     */
    onTouchStart(event: EventTouch) {
        let touchPos = event.getUILocation();
        let [row, col] = this.getCellFromPosition(new Vec3(touchPos.x, touchPos.y, 0));
        if (row >= 0 && col >= 0) {
            this.startRow = row;
            this.startCol = col;
            this.selectedCells = [this.cellNodes[row][col]];
            this.startPos = this.cellNodes[row][col].getWorldPosition();
            this.dragLine.setWorldPosition(this.startPos);
            this.direction = null;
        }
    }

    /**
     * Xử lý khi người chơi kéo
     * - Xác định hướng kéo
     * - Vẽ đường kéo
     */
    onTouchMove(event: EventTouch) {
        if (this.startRow < 0) return;

        let touchPos = event.getUILocation();
        let currentPos = new Vec3(touchPos.x, touchPos.y, 0);

        // Nếu kéo ra ngoài grid
        let [row, col] = this.getCellFromPosition(currentPos);
        if (row < 0 || col < 0) return;

        let dx = col - this.startCol;
        let dy = row - this.startRow;
        let angle = 0;

        const bgSize = this.getBgSize();
        let distance = 0;

        this.stepNode = Math.max(Math.abs(dx), Math.abs(dy))

        if (dx === 0 || dy === 0) {
            distance = this.stepNode * bgSize + bgSize;
        } else if (Math.abs(dx) === Math.abs(dy)) {
            distance = Math.sqrt(2) * this.stepNode * bgSize + bgSize;
        } else {
            return;
        }

        // Tính toán vị trí giữa startPos và currentPos
        let endpos = this.cellNodes[row][col].getWorldPosition();
        let midPos = new Vec3(
            (this.startPos.x + endpos.x) / 2,
            (this.startPos.y + endpos.y) / 2,
            0
        );
        this.dragLine.setWorldPosition(midPos);

        if (dx === 0 && dy < 0) { this.direction = 'vertical-up'; angle = 90; } // Kéo lên theo chiều dọc
        else if (dx === 0 && dy > 0) { this.direction = 'vertical-down'; angle = -90; } // Kéo xuống theo chiều dọc
        else if (dy === 0 && dx > 0) { this.direction = 'horizontal-right'; angle = 0; } // Kéo phải theo chiều ngang
        else if (dy === 0 && dx < 0) { this.direction = 'horizontal-left'; angle = 180; } // Kéo trái theo chiều ngang
        else if (dx > 0 && dy < 0) { this.direction = 'diagonal-up-right'; angle = 45; } // Kéo chéo lên phải
        else if (dx < 0 && dy < 0) { this.direction = 'diagonal-up-left'; angle = 135; } // Kéo chéo lên trái
        else if (dx > 0 && dy > 0) { this.direction = 'diagonal-down-right'; angle = -45; } // Kéo chéo xuống phải
        else if (dx < 0 && dy > 0) { this.direction = 'diagonal-down-left'; angle = -135; } // Kéo chéo xuống trái
        console.log(dx, dy, this.direction);

        this.changeDragLine(distance, angle);
    }

    /**
     * Xử lý khi người chơi thả tay
     * - Reset trạng thái chọn
     * - Xóa màu highlight và đường kéo
     */
    onTouchEnd(event: EventTouch) {
        // Chọn các ô
        this.selectedCells = [];
        if (this.direction) {
            switch (this.direction) {
                case 'vertical-up':
                    
                    break;
                case 'vertical-down':

                    break;
                case 'horizontal-right':

                    break;
                case 'horizontal-left':

                    break;
                case 'diagonal-up-right':

                    break;
                case 'diagonal-up-left':

                    break;
                case 'diagonal-down-right':

                    break;
                case 'diagonal-down-left':

                    break;
            }
        }
        // if (this.direction === 'horizontal' && row === this.startRow) {
        //     let start = Math.min(this.startCol, col);
        //     let end = Math.max(this.startCol, col);
        //     for (let j = start; j <= end; j++) {
        //         this.selectedCells.push(this.cellNodes[row][j]);
        //     }
        // } else if (this.direction === 'vertical' && col === this.startCol) {
        //     let start = Math.min(this.startRow, row);
        //     let end = Math.max(this.startRow, row);
        //     for (let i = start; i <= end; i++) {
        //         this.selectedCells.push(this.cellNodes[i][col]);
        //     }
        // } else if (this.direction === 'diagonal-down-right') {
        //     let steps = Math.min(Math.abs(dx), Math.abs(dy));
        //     for (let k = 0; k <= steps; k++) {
        //         let r = this.startRow + k;
        //         let c = this.startCol + k;
        //         if (r < 10 && c < 10) this.selectedCells.push(this.cellNodes[r][c]);
        //     }
        // } else if (this.direction === 'diagonal-down-left') {
        //     let steps = Math.min(Math.abs(dx), Math.abs(dy));
        //     for (let k = 0; k <= steps; k++) {
        //         let r = this.startRow + k;
        //         let c = this.startCol - k;
        //         if (r < 10 && c >= 0) this.selectedCells.push(this.cellNodes[r][c]);
        //     }
        // } else if (this.direction === 'diagonal-up-right') {
        //     let steps = Math.min(Math.abs(dx), Math.abs(dy));
        //     for (let k = 0; k <= steps; k++) {
        //         let r = this.startRow - k;
        //         let c = this.startCol + k;
        //         if (r >= 0 && c < 10) this.selectedCells.push(this.cellNodes[r][c]);
        //     }
        // } else if (this.direction === 'diagonal-up-left') {
        //     let steps = Math.min(Math.abs(dx), Math.abs(dy));
        //     for (let k = 0; k <= steps; k++) {
        //         let r = this.startRow - k;
        //         let c = this.startCol - k;
        //         if (r >= 0 && c >= 0) this.selectedCells.push(this.cellNodes[r][c]);
        //     }
        // }
        console.log(this.selectedCells);
        this.resetAll();
    }

    /**
     * Reset toàn bộ trạng thái
     */
    resetAll() {
        this.selectedCells = [];
        this.startRow = -1;
        this.startCol = -1;
        this.direction = null;
        this.startPos = null;
        this.changeDragLine(0, 0);
    }


    /**
     * Lấy kích thước của ô
     * @returns Kích thước của ô
     */
    private getBgSize(): number {
        const bgNode = this.cellNode.data.getChildByPath('bg');
        return bgNode ? bgNode.getComponent(UITransform).contentSize.width : 50;
    }

    /**
     * Chuyển đổi tọa độ touch thành vị trí ô trong lưới
     * @param pos Tọa độ touch
     * @returns Vị trí [hàng, cột] trong lưới
     */
    getCellFromPosition(pos: Vec3): [number, number] {
        const bgSize = this.getBgSize();
        let localPos = this.gridNode.getComponent(UITransform).convertToNodeSpaceAR(pos);
        let col = Math.floor((localPos.x + (this.grid.length * bgSize) / 2) / bgSize);
        let row = Math.floor((-localPos.y + (this.grid.length * bgSize) / 2) / bgSize);

        if (row >= 0 && row < 10 && col >= 0 && col < 10) return [row, col];

        return [-1, -1];
    }

    /**
     * Thay đổi thông số dragLine
     * @param newLine Thông số mới cho dragLine
     */
    changeDragLine(newLine: number, angle: number) {
        this.dragLine.getComponent(UITransform).setContentSize(newLine, 50);
        this.dragLine.angle = angle;
    }
}
