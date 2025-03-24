import { _decorator, Component, Node, Prefab, instantiate, UITransform, tween, Vec3, Button, Label, Layout } from 'cc';
import { MenuControler } from './MenuControler';
const { ccclass, property } = _decorator;

@ccclass('PopupSettingLevel')
export class PopupSettingLevel extends Component {

    @property({ type: Node, tooltip: "Layout chứa các topic" })
    private layoutTopic: Node = null;

    @property({ type: Prefab, tooltip: "Prefab của topic item" })
    private prefabTopic: Prefab = null;

    @property({ type: Prefab, tooltip: "Prefab của dropdown level" })
    private dropDown: Prefab = null;

    @property({ type: Node, tooltip: "Node cần di chuyển chiều rộng" })
    private moveNode: Node = null;

    @property({ type: Button, tooltip: "Nút xác nhận" })
    private confirmButton: Button = null;

    private currentTopic: number = 0;
    private currentLevel: string = "";
    private topics: { name: string, image: any }[] = [];
    private selectedTopicNode: Node = null;
    private scaleTween: any = null;

    protected onLoad(): void {
        // Gắn sự kiện cho nút xác nhận
        this.confirmButton.node.on(Button.EventType.CLICK, this.onConfirm, this);
    }

    /**
     * Load và hiển thị các topic
     * @param topics - Mảng chứa thông tin các topic
     * @param currentTopic - Chỉ số topic hiện tại
     * @param currentLevel - Level hiện tại
     */
    public loadTopics(topics: { name: string, image: any }[], currentTopic: number, currentLevel: string): void {
        this.topics = topics;
        this.currentTopic = currentTopic;
        this.currentLevel = currentLevel;

        // Xóa các topic cũ nếu có
        this.layoutTopic.removeAllChildren();

        // Tạo các topic mới
        topics.forEach((topic, index) => {
            const topicNode = instantiate(this.prefabTopic);
            this.layoutTopic.addChild(topicNode);

            // Gắn sự kiện click
            topicNode.on(Node.EventType.TOUCH_END, () => this.onTopicSelected(topicNode, index));

            // Nếu là topic đang được chọn, scale to
            if (index === currentTopic) {
                this.selectedTopicNode = topicNode;
                this.startScaleAnimation(topicNode);
            }
        });
    }

    /**
     * Xử lý khi topic được chọn
     */
    private onTopicSelected(topicNode: Node, index: number): void {
        // Dừng animation của topic cũ nếu có
        if (this.selectedTopicNode) {
            this.stopScaleAnimation(this.selectedTopicNode);
        }

        this.selectedTopicNode = topicNode;
        this.currentTopic = index;
        this.startScaleAnimation(topicNode);
    }

    /**
     * Bắt đầu animation scale
     */
    private startScaleAnimation(node: Node): void {
        if (this.scaleTween) {
            this.scaleTween.stop();
        }

        this.scaleTween = tween(node)
            .repeatForever(
                tween()
                    .to(0.5, { scale: new Vec3(1.1, 1.1, 1.1) })
                    .to(0.5, { scale: new Vec3(1, 1, 1) })
            )
            .start();
    }

    /**
     * Dừng animation scale
     */
    private stopScaleAnimation(node: Node): void {
        if (this.scaleTween) {
            this.scaleTween.stop();
            this.scaleTween = null;
        }
        node.scale = new Vec3(1, 1, 1);
    }

    /**
     * Di chuyển chiều rộng của node
     * @param minWidth - Chiều rộng tối thiểu
     * @param maxWidth - Chiều rộng tối đa
     */
    public onDropDown(minWidth: number, maxWidth: number): void {
        const transform = this.moveNode.getComponent(UITransform);
        if (!transform) return;

        tween(transform)
            .to(0.3, { width: maxWidth })
            .to(0.3, { width: minWidth })
            .start();
    }

    /**
     * Xử lý khi nút xác nhận được bấm
     */
    private onConfirm(): void {
        // Gọi callback về MenuControler
        MenuControler.Instance.onTopicLevelSelected(this.currentTopic, this.currentLevel);
        this.node.active = false;
    }

    protected onDestroy(): void {
        // Dọn dẹp các tween khi component bị hủy
        if (this.scaleTween) {
            this.scaleTween.stop();
        }
    }
}


