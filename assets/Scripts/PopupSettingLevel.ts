import { _decorator, Component, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopupSettingLevel')
export class PopupSettingLevel extends Component {

    @property({ type: Node, tooltip: "" })
    private layoutTopic: Node = null;

    @property({ type: Prefab, tooltip: "" })
    private prefabTopic: Prefab = null;

    @property({ type: Prefab, tooltip: "" })
    private dropDown: Prefab = null;
}


