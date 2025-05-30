import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('APIManager')
export class APIManager extends Component {

    public static urlAPI: string = "https://apiwordpuzzle-tele.gamebatta.com";// batta
    // public static sessionID;
    public static userDATA: {
        id?: number;
        username?: string;
        [key: string]: any; // Cho phép thêm thuộc tính động nếu cần
    } = {};

    public static requestData(key: string, data: any, callBack: (response: any) => void) {
        const url = this.urlAPI + key;

        APIManager.CallRequest(`POST`, data, url, (response) => {
            callBack(response);
        }, (xhr) => {
            // xhr.setRequestHeader('Authorization', 'Bearer ' + APIManager.urlParam(`token`));
            xhr.setRequestHeader("Content-type", "application/json");
        });
    }

    public static CallRequest(method, data, url, callback, callbackHeader) {
        let param = this;
        var xhr = new XMLHttpRequest();

        xhr.onerror = () => {
        };

        xhr.ontimeout = () => {
        }

        xhr.onabort = () => {
        }

        xhr.onloadend = () => {
        }

        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) return;
            if (xhr.status == 200 && xhr.responseText) {
                var response = JSON.parse(xhr.responseText);
                console.log(`Call.${method}=>`, url, "\n", response);
                callback(response);
            }
            else {
                response = JSON.parse(xhr.responseText);
                response.status = xhr.status;
                callback(null);
            }
        };
        xhr.open(method, url, true);
        callbackHeader(xhr);
        let body
        if (data != null)
            body = JSON.stringify(data);
        else
            body = data
        // console.log(method, "body: ", body)
        xhr.send(body);
    }

    public static logChallenge(name: string, score: number) {
        APIManager.requestData(`/api/updateEventChallenge`, {
            "username": APIManager.userDATA?.username,
            "name": name,
            "score": score
        }, res => { })
    }

    public static urlParam(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.search);
        return (results !== null) ? results[1] || 0 : false;
    }
}


