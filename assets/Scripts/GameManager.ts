import { _decorator, Component, Node } from 'cc';
import { MenuControler } from './MenuControler';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    public static Level = [`A1`, `A2`, `B1`, `B2`, `C1`, `C2`];

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

    public static timeLimit: number = 180; // Thời gian chơi
    public static initScore: number = 1000; // Điểm ban đầu
    public static bonusScore: number = 500; // Điểm cộng thêm khi tìm được từ
    public static hintScore: number = -300; // Điểm trừ khi dùng gợi ý
    public static letterScore: number = -200; // Điểm trừ khi lật chữ cái
    public static readScore: number = -400; // Điểm trừ khi nghe từ

    // Cấu trúc dữ liệu cho các bộ từ
    public static wordSets = {
        "Animals": [
            {
                answers: ["ELEPHANT", "DOG", "BIRD", "HORSE", "KANGA ROO"],
                hints: ["Animal with tusks?", "Loyal animal?", "Animal that can fly?", "Animal that pulls a cart?", "Animal that jumps high?"]
            },
            {
                answers: ["CROCODILE", "DEER", "EAGLE", "RHINO", "DOLPHIN"],
                hints: ["Animal living in the river?", "Animal with branched antlers?", "Animal that flies high?", "Animal with a horn on its nose?", "Intelligent animal underwater?"]
            },
            {
                answers: ["BAT", "CAMEL", "SHARK", "PARROT", "LEOPARD"],
                hints: ["Animal that flies at night?", "Animal with humps?", "Predatory animal in the sea?", "Animal that can talk?", "Animal with spots?"]
            },
            {
                answers: ["WHALE", "TURTLE", "CHEETAH", "OWL", "GORILLA"],
                hints: ["Largest animal in the sea?", "Animal that carries its house on its back?", "Fastest running animal?", "Night hunter animal?", "Powerful animal in the jungle?"]
            }
        ],
        "Food": [
            {
                answers: ["RAMEN", "KEBAB", "OMELETTE", "PHO", "LASAGNA"],
                hints: ["Japanese noodle dish?", "Skewered grilled meat dish?", "Fried egg dish?", "Vietnamese soup?", "Layered Italian pasta dish?"]
            },
            {
                answers: ["DIM SUM", "PAELLA", "FALAFEL", "BIRYANI", "CHOWDER"],
                hints: ["Small Chinese dishes?", "Spanish rice dish?", "Middle Eastern chickpea fritter?", "Indian rice dish?", "Seafood soup?"]
            },
            {
                answers: ["CROISSANT", "BROWNIE", "PUDDING", "WAFFLE", "TIRAMISU"],
                hints: ["French crescent-shaped pastry?", "Brown chocolate cake?", "Soft dessert?", "Grid-patterned cake?", "Italian coffee-flavored dessert?"]
            },
            {
                answers: ["SPRING ROLL", "MEATBALL", "RISOTTO", "GUACAMOLE", "DUMPLING"],
                hints: ["Vietnamese fried roll?", "Small ball of meat?", "Creamy Italian rice dish?", "Mexican avocado dip?", "Small dough with filling?"]
            }
        ],
        "Fruits": [
            {
                answers: ["JACKFRUIT", "STARFRUIT", "APRICOT", "BANANA", "PEAR"],
                hints: ["Large tropical fruit?", "Star-shaped fruit?", "Yellow fruit like a peach?", "Long, curved, yellow fruit?", "Bell-shaped fruit?"]
            },
            {
                answers: ["PERSIMMON", "CLEMENTINE", "DURIAN", "SATSUMA", "PLUM"],
                hints: ["Soft orange autumn fruit?", "Sweet seedless orange?", "Strong-smelling fruit?", "Seedless citrus that's super easy to peel?", "Small purple fruit?"]
            },
            {
                answers: ["RAMBUTAN", "GUAVA", "LYCHEE", "MANGO", "FIG"],
                hints: ["Red hairy fruit?", "Fragrant tropical fruit?", "Small sweet fruit with red skin?", "Tropical fruit with smooth, golden skin?", "Small sweet Mediterranean fruit?"]
            },
            {
                answers: ["GOOSEBERRY", "QUINCE", "ORANGE", "OLIVE", "COCONUT"],
                hints: ["Small sour green berry?", "Sour pear-like fruit?", "Citrus fruit with juicy segments?", "Small fruit used for oil?", "Hard-shelled tropical treat?"]
            }
        ],
        "School": [
            {
                answers: ["BACKPACK", "CALCULATOR", "MARKER", "RULER", "ERASER"],
                hints: ["Item for carrying things?", "Handheld calculating device?", "Pen for writing on a whiteboard?", "Tool for measuring length?", "Tool for removing writing?"]
            },
            {
                answers: ["SCHEDULE", "HOMEWORK", "PROJECT", "EXAM", "LESSON"],
                hints: ["Timetable?", "Work to be done at home?", "Academic assignment?", "Test of knowledge?", "Teaching session?"]
            },
            {
                answers: ["SCHOOLBAG", "TEXTBOOK", "UNIFORM", "LOCKER", "BELL"],
                hints: ["Bag for carrying school items?", "Educational book?", "Required clothing?", "Storage cabinet?", "Signaling device?"]
            },
            {
                answers: ["DETENTION", "LECTURE", "ASSEMBLY", "FIELD TRIP", "RECESS"],
                hints: ["Punishment after school?", "Teaching presentation?", "Whole school gathering?", "Educational visit?", "Break time?"]
            }
        ],
        "Technology": [
            {
                answers: ["HEADPHONES", "CHARGER", "SPEAKER", "WEBCAM", "CABLE"],
                hints: ["Listening device for ears?", "Device for replenishing battery power?", "Device for playing sound?", "Camera for online video?", "Cord for connecting devices?"]
            },
            {
                answers: ["DATABASE", "FIREWALL", "NETWORK", "SERVER", "CLOUD"],
                hints: ["Organized collection of data?", "Security system for computers?", "Interconnected group of computers?", "Computer providing services?", "Remote data storage?"]
            },
            {
                answers: ["STREAMING", "DEBUGGING", "UPDATING", "GAMING", "CODING"],
                hints: ["Broadcasting live video?", "Finding and fixing errors?", "Installing new versions?", "Playing video games?", "Writing computer programs?"]
            },
            {
                answers: ["WEARABLE", "PROCESSOR", "BATTERY", "SENSOR", "CHIP"],
                hints: ["Device worn on the body?", "Central unit performing calculations?", "Device storing electrical energy?", "Device detecting changes?", "Small piece of electronic circuitry?"]
            }
        ],
        "Vehicle": [
            {
                answers: ["SCOOTER", "SKATEBOARD", "TRAM", "WAGON", "CART"],
                hints: ["Small motorbike?", "Board for riding?", "Electric streetcar?", "Pulled vehicle for goods?", "Wheeled container?"]
            },
            {
                answers: ["JETSKI", "YACHT", "FERRY", "CANOE", "RAFT"],
                hints: ["Personal watercraft?", "Luxury boat?", "Boat for transporting people?", "Small boat paddled by hand?", "Floating platform?"]
            },
            {
                answers: ["LIMOUSINE", "CABRIOLET", "HATCHBACK", "PICKUP", "MINIVAN"],
                hints: ["Long luxurious car?", "Car with a folding roof?", "Car with a rear door that opens upwards?", "Truck with an open cargo area?", "Small family van?"]
            },
            {
                answers: ["BULLDOZER", "EXCAVATOR", "FORKLIFT", "CRANE", "ROLLER"],
                hints: ["Earth-moving machine?", "Heavy equipment for digging?", "Vehicle for lifting and moving materials?", "Machine for lifting heavy objects?", "Machine for compacting surfaces?"]
            }
        ]
    };

    /**
     * Lấy ngẫu nhiên một bộ từ theo chủ đề
     * @returns Bộ từ ngẫu nhiên hoặc null nếu không tìm thấy chủ đề
     */
    public static getRandomWordSet() {
        const data = MenuControler.Instance.getSettingLevelData();
        const topicName = data.topics[data.currentTopic].name;
        const sets = this.wordSets[topicName];

        if (!sets || sets.length === 0) return;

        const randomIndex = Math.floor(Math.random() * sets.length);
        this.data.answers = sets[randomIndex].answers;
        this.data.hints = sets[randomIndex].hints;
    }

    /**
     * Tạo ma trận từ mảng các từ cho trước
     * @param words Mảng các từ cần đặt vào ma trận
     * @param size Kích thước ma trận (mặc định là 10x10)
     * @returns Ma trận ký tự
     */
    public static generateMatrix(size: number = 10) {
        // Xử lý các từ có khoảng trắng
        const processedWords = this.data.answers.map(word => word.replace(/\s+/g, ''));
        console.log("processed: ",processedWords);

        // Khởi tạo ma trận rỗng
        const matrix: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));

        // Hàm kiểm tra vị trí có thể đặt từ
        const canPlaceWord = (word: string, row: number, col: number, direction: number[]): boolean => {
            const [dr, dc] = direction;
            for (let i = 0; i < word.length; i++) {
                const newRow = row + i * dr;
                const newCol = col + i * dc;
                if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) return false;
                if (matrix[newRow][newCol] !== '' && matrix[newRow][newCol] !== word[i]) return false;
            }
            return true;
        };

        // Hàm đặt từ vào ma trận
        const placeWord = (word: string, row: number, col: number, direction: number[]): void => {
            const [dr, dc] = direction;
            for (let i = 0; i < word.length; i++) {
                matrix[row + i * dr][col + i * dc] = word[i];
            }
            console.log(`Đặt từ ${word} theo hướng [${dr},${dc}]`);
        };

        // Các hướng có thể đặt từ (ngang, dọc, chéo)
        const directions = [
            [0, 1],   // ngang phải
            [1, 0],   // dọc xuống
            [1, 1],   // chéo phải xuống
            [-1, 1],   // chéo phải lên
            // [0, -1],   // ngang trái
            // [-1, 0],   // dọc lên
            // [-1, -1],   // chéo trái xuống
            // [1, -1],   // chéo trái lên
        ];

        // Đặt các từ vào ma trận
        for (const word of processedWords) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 200;

            while (!placed && attempts < maxAttempts) {
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const row = Math.floor(Math.random() * size);
                const col = Math.floor(Math.random() * size);

                if (canPlaceWord(word, row, col, direction)) {
                    placeWord(word, row, col, direction);
                    placed = true;
                }
                attempts++;
            }
        }

        // Điền các ô trống bằng ký tự ngẫu nhiên
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (matrix[i][j] === '') {
                    matrix[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
                }
            }
        }

        this.data.matrixKey = matrix;
    }
}


