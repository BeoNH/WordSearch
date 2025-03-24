import { _decorator, Component, Node } from 'cc';
import { DEBUG } from 'cc/env';
import { UIControler } from './UIControler';
import { GameManager } from './GameManager';
import { MenuControler } from './MenuControler';
import { WordSearch } from './WordSearch';
const { ccclass, property } = _decorator;


if (!DEBUG) {
    console.log = function () { };
}


@ccclass('GameControler')
export class GameControler extends Component {
    public static Instance: GameControler;

    @property({ type: Node, tooltip: "scene gamePlay" })
    private scenePlay: Node = null;
    @property({ type: Node, tooltip: "scene menu" })
    private sceneMenu: Node = null;

    // @property({ type: Label, tooltip: "hiển thị số lượt chơi" })
    // private labelTurn: Label = null;

    private numTurn: number = 0; // số lượt chơi

    onLoad() {
        GameControler.Instance = this;
        window.addEventListener("beforeunload", this.onBeforeUnload);

        this.sceneMenu.active = true;
        this.scenePlay.active = false;

        // this.loginBatta();
    }

    onDestroy() {
        window.removeEventListener("beforeunload", this.onBeforeUnload);
    }

    // Kiểm tra đóng cửa sổ game
    private onBeforeUnload = (event: Event) => {
        console.log("Người chơi đang đóng cửa sổ hoặc làm mới trang.");
    }

    openMenu() {
        this.sceneMenu.active = true;
        this.scenePlay.active = false;
        // this.remainTurn();
    }

    openGame() {
        this.sceneMenu.active = false;
        this.scenePlay.active = true;
        WordSearch.Instance.initGame();

        // if (this.numTurn <= 0) {
        //     UIControler.instance.onMess(`No turns remaining. \nPlease purchase extra turns to proceed.`);
        //     return;
        // }

        // const toppic = GameManager.Toppic[MenuControler.Instance.numToppic];

        // const url = `/imageToWord/getQuestion`;
        // const data = {
        //     "type": toppic,
        // };
        // APIManager.requestData(`POST`, url, data, res => {
        //     if (!res) {
        //         UIControler.instance.onMess(`Error: ${url} => ${res}`);
        //         return;
        //     }

        //     this.sceneMenu.active = false;
        //     this.scenePlay.active = true;
        //     Game_Vocabulary.Instance.initGame(toppic, res.data);
        // });
    }

    // // Đăng nhập Batta lấy thông tin
    // private loginBatta() {
    //     const url = `/imageToWord/login`;
    //     const data = {
    //         "token": APIManager.urlParam(`token`),
    //     };
    //     APIManager.requestData(`POST`, url, data, res => {
    //         console.log("Login_info: ", res)
    //         if (!res) {
    //             UIControler.instance.onMess(`Error: ${url} => ${res}`);
    //             return;
    //         }
    //         APIManager.userDATA = res;
    //         this.remainTurn();
    //     });
    // }

    // // Cập nhật thông tin số lượt
    // private remainTurn(callback?: (remainTurn: number) => void): void {
    //     const url = `/imageToWord/getTurn`;
    //     const data = {
    //         "username": APIManager.userDATA?.username,
    //     };
    //     APIManager.requestData(`POST`, url, data, res => {
    //         if (!res) {
    //             UIControler.instance.onMess(`Error: ${url} => ${res}`);
    //             return;
    //         }
    //         this.numTurn = res.remain_turn;
    //         if (callback) {
    //             callback(this.numTurn);
    //         }
    //     });
    // }
}


