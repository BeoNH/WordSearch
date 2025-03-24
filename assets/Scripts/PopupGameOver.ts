import { _decorator, Component, Label, Node } from 'cc';
import { WordSearch } from './WordSearch';
import { NumberScrolling } from './NumberScrolling';
const { ccclass, property } = _decorator;

@ccclass('PopupGameOver')
export class PopupGameOver extends Component {
    
    @property({ type: Label, tooltip: "Label hiển thị thời gian trong popup game over" })
    private timeLabelOver: Label = null;

    @property({ type: NumberScrolling, tooltip: "Label hiển thị điểm cộng thêm trong popup game over" })
    private bonusScrolling: NumberScrolling = null;

    @property({ type: NumberScrolling, tooltip: "Component số chạy cho điểm trong popup game over" })
    private scoreScrolling: NumberScrolling = null;

    protected onDisable(): void {
        this.timeLabelOver.string = '0s';
        this.bonusScrolling.setValue(0);
        this.scoreScrolling.setValue(0);
    }

    /**
     * Hiển thị hiệu ứng game over và tính điểm
     */
    public showGameOver(): void {
        const remainingScore = WordSearch.Instance.currentScore;
        const remainingTime = WordSearch.Instance.remainingTime;
        this.timeLabelOver.string = `${remainingTime}s`;

        // Tính điểm cộng thêm từ thời gian
        const timeBonus = remainingTime * 10;
        
        this.scheduleOnce(()=>{
            // Hiển thị điểm cộng thêm
            this.bonusScrolling.to(timeBonus);
        },1)

        // Chạy hiệu ứng điểm cộng thêm
        this.scoreScrolling.to(remainingScore, 0.3, () => {
            // Chạy hiệu ứng điểm
            this.scheduleOnce(() => {
                this.scoreScrolling.to(remainingScore + timeBonus);
            }, 1.5);
        });
    }
}


