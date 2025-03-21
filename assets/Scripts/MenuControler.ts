import { _decorator, Component, Label, Node, Sprite, resources, SpriteFrame } from 'cc';
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

    numToppic: number = 0; // chỉ số chủ đề đang được hiển thị
    private topicImages: SpriteFrame[] = []; // Lưu trữ ảnh theo chủ đề

    protected onLoad(): void {
        MenuControler.Instance = this;
        this.loadAllTopicImages();
    }

    // Load tất cả ảnh chủ đề khi khởi động game
    private loadAllTopicImages() {
        let loadedCount = 0;
        const totalTopics = GameManager.Toppic.length;

        GameManager.Toppic.forEach((topicName, index) => {
            resources.load(`Sprites/Topic/${topicName}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                if (!err) {
                    this.topicImages[index] = spriteFrame;
                }
                loadedCount++;

                // Khi đã load xong tất cả ảnh, cập nhật hiển thị
                if (loadedCount === totalTopics) {
                    this.updateTopicDisplay();
                }
            });
        });
    }

    // Chuyển vòng các chủ đề
    onNextToppic(e, txt: string) {
        switch (txt) {
            case "Right":
                this.numToppic += 1;
                break;
            case "Left":
                this.numToppic -= 1;
                break;
        }

        const topicsLength = GameManager.Toppic.length;
        if (this.numToppic >= topicsLength) {
            this.numToppic = 0;
        } else if (this.numToppic < 0) {
            this.numToppic = topicsLength - 1;
        }

        this.updateTopicDisplay();
    }

    // Hàm cập nhật giao diện chủ đề và hình ảnh
    updateTopicDisplay() {
        this.labelToppic.string = GameManager.Toppic[this.numToppic];
    
        const spriteFrame = this.topicImages[this.numToppic];
        if (spriteFrame) {
            this.imageToppic.spriteFrame = spriteFrame;
        } else {
            this.imageToppic.spriteFrame = this.defaultImage;
        }
    }
}


