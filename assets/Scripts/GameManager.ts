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
                answers: ["PEAR", "PLUM", "APRICOT", "FIG", "POMEGRANATE"],
                hints: ["Bell-shaped fruit?", "Small purple fruit?", "Yellow fruit like a peach?", "Small sweet Mediterranean fruit?", "Red fruit with many seeds?"]
            },
            {
                answers: ["DRAGON FRUIT", "DURIAN", "LYCHEE", "JACKFRUIT", "RAMBUTAN"],
                hints: ["Pink-skinned fruit with white flesh?", "Strong-smelling fruit?", "Small sweet fruit with red skin?", "Large tropical fruit?", "Red hairy fruit?"]
            },
            {
                answers: ["TANGERINE", "CLEMENTINE", "GUAVA", "PASSION FRUIT", "STARFRUIT"],
                "hints": ["Small easy-to-peel orange?", "Sweet seedless orange?", "Fragrant tropical fruit?", "Sour fruit with many seeds?", "Star-shaped fruit?"]
            },
            {
                answers: ["DATE", "OLIVE", "PERSIMMON", "QUINCE", "GOOSEBERRY"],
                hints: ["Sweet dried Middle Eastern fruit?", "Small fruit used for oil?", "Soft orange autumn fruit?", "Sour pear-like fruit?", "Small sour green berry?"]
            }
        ],
        "School": [
            {
                answers: ["BACKPACK", "RULER", "ERASER", "MARKER", "CALCULATOR"],
                hints: ["Item for carrying things?", "Tool for measuring length?", "Tool for removing writing?", "Pen for writing on a whiteboard?", "Handheld calculating device?"]
            },
            {
                answers: ["SCHEDULE", "HOMEWORK", "EXAM", "PROJECT", "LESSON"],
                hints: ["Timetable?", "Work to be done at home?", "Test of knowledge?", "Academic assignment?", "Teaching session?"]
            },
            {
                answers: ["UNIFORM", "LOCKER", "BELL", "TEXTBOOK", "SCHOOLBAG"],
                hints: ["Required clothing?", "Storage cabinet?", "Signaling device?", "Educational book?", "Bag for carrying school items?"]
            },
            {
                answers: ["LECTURE", "DETENTION", "RECESS", "ASSEMBLY", "FIELD TRIP"],
                hints: ["Teaching presentation?", "Punishment after school?", "Break time?", "Whole school gathering?", "Educational visit?"]
            }
        ],
        "Technology": [
            {
                answers: ["HEADPHONES", "CHARGER", "CABLE", "SPEAKER", "WEBCAM"],
                hints: ["Listening device for ears?", "Device for replenishing battery power?", "Cord for connecting devices?", "Device for playing sound?", "Camera for online video?"]
            },
            {
                answers: ["CLOUD", "SERVER", "DATABASE", "FIREWALL", "NETWORK"],
                hints: ["Remote data storage?", "Computer providing services?", "Organized collection of data?", "Security system for computers?", "Interconnected group of computers?"]
            },
            {
                answers: ["GAMING", "STREAMING", "CODING", "DEBUGGING", "UPDATING"],
                hints: ["Playing video games?", "Broadcasting live video?", "Writing computer programs?", "Finding and fixing errors?", "Installing new versions?"]
            },
            {
                answers: ["WEARABLE", "SENSOR", "CHIP", "BATTERY", "PROCESSOR"],
                hints: ["Device worn on the body?", "Device detecting changes?", "Small piece of electronic circuitry?", "Device storing electrical energy?", "Central unit performing calculations?"]
            }
        ],
        "Vehicle": [
            {
                answers: ["SCOOTER", "TRAM", "WAGON", "CART", "SKATEBOARD"],
                hints: ["Small motorbike?", "Electric streetcar?", "Pulled vehicle for goods?", "Wheeled container?", "Board for riding?"]
            },
            {
                answers: ["JETSKI", "YACHT", "FERRY", "CANOE", "RAFT"],
                hints: ["Personal watercraft?", "Luxury boat?", "Boat for transporting people?", "Small boat paddled by hand?", "Floating platform?"]
            },
            {
                answers: ["PICKUP", "LIMOUSINE", "CONVERTIBLE", "HATCHBACK", "MINIVAN"],
                hints: ["Truck with an open cargo area?", "Long luxurious car?", "Car with a retractable roof?", "Car with a rear door that opens upwards?", "Small family van?"]
            },
            {
                answers: ["BULLDOZER", "CRANE", "FORKLIFT", "EXCAVATOR", "ROLLER"],
                hints: ["Earth-moving machine?", "Machine for lifting heavy objects?", "Vehicle for lifting and moving materials?", "Heavy equipment for digging?", "Machine for compacting surfaces?"]
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
            [0, 1],   // ngang
            [1, 0],   // dọc
            [1, 1],   // chéo xuống
            [1, -1]   // chéo lên
        ];

        // Đặt các từ vào ma trận
        for (const word of processedWords) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;

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


