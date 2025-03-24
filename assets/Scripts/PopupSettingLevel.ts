import { _decorator, Component, Node, Prefab, instantiate, UITransform, tween, Vec3, Button, Label, Layout, Sprite, Event } from 'cc';
import { MenuControler } from './MenuControler';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('PopupSettingLevel')
export class PopupSettingLevel extends Component {

    @property({ type: Node, tooltip: "Node cần di chuyển chiều rộng" })
    private dropDown: Node = null;

    @property({ type: Node, tooltip: "Layout sách các level" })
    private layoutLevel: Node = null;

    @property({ type: Prefab, tooltip: "Prefab của level item" })
    private prefabLevel: Prefab = null;

    @property({ type: Node, tooltip: "Layout chứa các topic" })
    private layoutTopic: Node = null;

    @property({ type: Prefab, tooltip: "Prefab của topic item" })
    private prefabTopic: Prefab = null;


    private currentTopic: number = 0;
    private currentLevel: number = 0;
    private selectedTopicNode: Node = null;
    private scaleTween: any = null;
    private isExpanded: boolean = false; // Trạng thái mở rộng của dropdown
    private levelNodes: Node[] = []; // Lưu trữ các node level để quản lý

    protected onLoad(): void { }

    // Dọn dẹp các tween khi component bị hủy
    protected onDisable(): void {
        if (this.scaleTween) {
            this.scaleTween.stop();
        }
        this.dropDown.getComponent(UITransform).height = 58;
        this.levelNodes = []
    }

    /**
     * Load và hiển thị các topic
     * @param topics - Mảng chứa thông tin các topic
     * @param currentTopic - Chỉ số topic hiện tại
     * @param currentLevel - Level hiện tại
     */
    public initSettingList(topics: { name: string, image: any }[], currentTopic: number, currentLevel: number): void {
        this.currentTopic = currentTopic;
        this.currentLevel = currentLevel;

        this.layoutTopic.removeAllChildren();
        this.layoutLevel.removeAllChildren();

        topics.forEach((topic, index) => {
            const topicNode = instantiate(this.prefabTopic);
            topicNode.parent = this.layoutTopic;
            topicNode.getComponentInChildren(Label).string = topic.name;
            topicNode.getComponentInChildren(Sprite).spriteFrame = topic.image;


            // Gắn sự kiện click
            topicNode.on(Node.EventType.TOUCH_END, () => this.onTopicSelected(topicNode, index));

            if (index === currentTopic) {
                this.selectedTopicNode = topicNode;
                this.startScaleAnimation(topicNode);
            }
        });

        GameManager.Level.forEach((level, index) => {
            const levelNode = instantiate(this.prefabLevel);
            levelNode.parent = this.layoutLevel;
            levelNode.name = `${level}`;
            levelNode.getComponent(Label).string = level;

            levelNode.on(Node.EventType.TOUCH_END, () => {
                this.onLevelSelect(index);
                this.onDropDown();
            });
            this.levelNodes.push(levelNode);
        });
        this.onLevelSelect(currentLevel);
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
                    .to(0.5, { scale: new Vec3(1.08, 1.08, 1.08) })
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
     * Toggle mở rộng/thu hẹp dropdown
     */
    public onDropDown(): void {
        const transform = this.dropDown.getComponent(UITransform);
        if (!transform) return;

        this.isExpanded = !this.isExpanded;
        const targetWidth = this.isExpanded ? 350 : 58;

        tween(transform)
            .to(0.3, { height: targetWidth })
            .start();
    }

    /**
     * Sắp xếp lại các node level theo thứ tự trong GameManager.Level
     * @param selectedIndex - Index của level được chọn
     */
    private onLevelSelect(selectedIndex: number): void {
        this.currentLevel = selectedIndex;
        const selectedNode = this.levelNodes.find(node => node.name === GameManager.Level[selectedIndex]);
        if (!selectedNode) return;

        this.levelNodes = [
            selectedNode,
            ...this.levelNodes.filter(node => node !== selectedNode).sort((a, b) => 
                GameManager.Level.indexOf(a.name) - GameManager.Level.indexOf(b.name)
            )
        ];

        this.levelNodes.forEach((node, index) => node.setSiblingIndex(index));
    }


    /**
     * Xử lý khi nút xác nhận được bấm
     */
    onConfirm(): void {
        MenuControler.Instance.onTopicLevelSelected(this.currentTopic, this.currentLevel);
    }
}


