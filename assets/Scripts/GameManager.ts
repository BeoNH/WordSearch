import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    // data mẫu
    public static Toppic = [`Animals`, `Fruits`, `Vehicle`];

    public static data = {
        // bảng các ký tự
        matrixKey: [
            ['G', 'L', 'S', 'Y', 'J', 'T', 'N', 'E', 'S', 'E'],
            ['D', 'O', 'F', 'S', 'H', 'O', 'U', 'S', 'E', 'L'],
            ['F', 'R', 'U', 'I', 'T', 'S', 'A', 'N', 'D', 'E'],
            ['B', 'I', 'R', 'D', 'S', 'A', 'N', 'D', 'S', 'P'],
            ['H', 'O', 'R', 'S', 'E', 'S', 'A', 'N', 'D', 'H'],
            ['C', 'A', 'R', 'S', 'A', 'N', 'D', 'S', 'T', 'A'],
            ['T', 'R', 'U', 'C', 'K', 'S', 'A', 'N', 'D', 'N'],
            ['B', 'O', 'A', 'T', 'S', 'A', 'N', 'D', 'G', 'T'],
            ['K', 'A', 'N', 'G', 'A', 'R', 'O', 'O', 'S', 'K'],
            ['A', 'N', 'I', 'M', 'A', 'L', 'D', 'A', 'N', 'D']
        ],
        // các đáp án
        answers: ["ELEPHANT", "DOG", "BIRD", "HORSE", "KANGA ROO"],
        // gợi ý
        hints: ["con vật có ngà ?", "con vật trung thành ?", "con vật biết bay ?", "con vật kéo xe ?", "con vật nhảy cao ?"],
    };
    public static timeLimit: number = 120; // Thời gian chơi
    public static initScore: number = 1000; // Điểm ban đầu
    public static bonusScore: number = 500; // Điểm cộng thêm khi tìm được từ
    public static hintScore: number = -300; // Điểm trừ khi dùng gợi ý
    public static letterScore: number = -200; // Điểm trừ khi lật chữ cái
    public static readScore: number = -400; // Điểm trừ khi nghe từ
}


