import { _decorator, Component, Label, Node, Sprite, resources, SpriteFrame } from 'cc';
import { PopupSettingLevel } from './PopupSettingLevel';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('MenuControler')
export class MenuControler extends Component {
    public static Instance: MenuControler;

    @property({ type: Label, tooltip: "Tên Chủ đề" })
    public labelToppic: Label = null;
    
    @property({ type: Sprite, tooltip: "Ảnh theo chủ đề" })
    public imageToppic: Sprite = null;

    @property({ type: SpriteFrame, tooltip: "Ảnh mặc định khi không tìm thấy ảnh trong Resources" })
    public defaultImage: SpriteFrame = null;

    @property({ type: Label, tooltip: "Label hiển thị level" })
    public labelLevel: Label = null;

    private numToppic: number = 0;
    private currentLevelIndex: number = 0; // Thêm biến để lưu chỉ số level hiện tại
    
    /** Mảng lưu trữ thông tin về các chủ đề (tên và ảnh) */
    private topics: { name: string, image: SpriteFrame }[] = [];

    protected onLoad(): void {
        MenuControler.Instance = this;
        this.loadTopics();
    }

    /**
     * Load tất cả ảnh chủ đề từ thư mục Resources
     * Tự động cập nhật hiển thị sau khi load xong
     */
    private loadTopics(): void {
        resources.loadDir('Sprites/Topic', SpriteFrame, (err, frames) => {
            if (err) {
                console.error('Lỗi khi load ảnh chủ đề:', err);
                return;
            }

            this.topics = frames.map(frame => ({
                name: frame.name,
                image: frame
            }));

            this.updateTopicDisplay();
            this.updateLevelDisplay();
        });
    }

    /**
     * Xử lý sự kiện khi người dùng chuyển đổi chủ đề
     * @param e - Event object
     * @param txt - Hướng chuyển đổi ("Right" hoặc "Left")
     */
    onNextToppic(e, txt: string) {
        switch (txt) {
            case "Right":
                this.numToppic += 1;
                break;
            case "Left":
                this.numToppic -= 1;
                break;
        }

        this.numToppic = (this.numToppic + this.topics.length) % this.topics.length;
        this.updateTopicDisplay();
    }

    /**
     * Cập nhật hiển thị chủ đề hiện tại
     * Hiển thị tên và ảnh của chủ đề được chọn
     */
    private updateTopicDisplay(): void {
        if (this.topics.length === 0) return;

        const currentTopic = this.topics[this.numToppic];
        this.labelToppic.string = currentTopic.name;
        this.imageToppic.spriteFrame = currentTopic.image || this.defaultImage;
    }

    /**
     * Cập nhật hiển thị level từ GameManager
     */
    private updateLevelDisplay(): void {
        if (this.labelLevel && GameManager.Level[this.currentLevelIndex]) {
            this.labelLevel.string = GameManager.Level[this.currentLevelIndex];
        }
    }

    /**
     * Mở popup cài đặt level
     * @param e - Event object chứa node được bấm
     */
    public openSettingLevel(e: any): void {
        const targetNode = e.target;
        if (!targetNode) return;

        const popupSetting = targetNode.getComponent(PopupSettingLevel);
        if (!popupSetting) {
            console.error('Node không có component PopupSettingLevel');
            return;
        }

        popupSetting.node.active = true;
        popupSetting.loadTopics(this.topics, this.numToppic, GameManager.Level[this.currentLevelIndex]);
    }

    /**
     * Callback khi người dùng chọn topic và level mới
     * @param newTopic - Chỉ số topic mới
     * @param newLevel - Level mới
     */
    public onTopicLevelSelected(newTopic: number, newLevel: string): void {
        // Cập nhật topic nếu có thay đổi
        if (newTopic !== this.numToppic) {
            this.numToppic = newTopic;
            this.updateTopicDisplay();
        }

        // Cập nhật level nếu có thay đổi
        const newLevelIndex = GameManager.Level.indexOf(newLevel);
        if (newLevelIndex !== -1 && newLevelIndex !== this.currentLevelIndex) {
            this.currentLevelIndex = newLevelIndex;
            this.updateLevelDisplay();
        }
    }
}


