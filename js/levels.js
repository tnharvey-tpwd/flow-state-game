// The level index where instructor codes are no longer required. 
// Example: 2 means Level 3 and beyond will bypass the modal.
const fullUnlockLevel = 2; 

// Pipe exits [Top, Right, Bottom, Left] (1 means open, 0 means closed)
const pipeDefs = {
    '|': [1, 0, 1, 0],
    '-': [0, 1, 0, 1],
    'L': [1, 1, 0, 0],
    'F': [0, 1, 1, 0],
    '7': [0, 0, 1, 1],
    'J': [1, 0, 0, 1],
    'T': [0, 1, 1, 1],
    'S': [0, 0, 1, 0], // Source flows Down
    'E': [1, 0, 0, 0]  // Exit receives from Top
};

// SVG graphics mapped to a 0-100 viewBox
const pipeSVGs = {
    '|': `<line x1="50" y1="0" x2="50" y2="100" />`,
    '-': `<line x1="0" y1="50" x2="100" y2="50" />`,
    'L': `<path d="M 50 0 L 50 50 L 100 50" />`,
    'F': `<path d="M 100 50 L 50 50 L 50 100" />`,
    '7': `<path d="M 0 50 L 50 50 L 50 100" />`,
    'J': `<path d="M 50 0 L 50 50 L 0 50" />`,
    'T': `<path d="M 0 50 L 100 50 M 50 50 L 50 100" />`,
    'S': `<circle cx="50" cy="20" r="10" fill="#a6e3a1" stroke="none"/><line x1="50" y1="20" x2="50" y2="100" />`,
    'E': `<circle cx="50" cy="80" r="10" fill="#f9e2af" stroke="none"/><line x1="50" y1="0" x2="50" y2="80" />`
};

const levels = [
// Level 1
    {
    maxInventoryCapacity: 5,
    initialInventory: ['|', 'L'],
    map: [
            "X X S X X",
            "X 7 J 7 X",
            ". F L 7 X",
            "X . X - X",
            "X . X | X",
            "X . . . X",
            "X X E X X"
    ]
    },
// Level 2
    {
    maxInventoryCapacity: 5,
    initialInventory: ['|', 'L'],
    map: [
            "X S X X X X",
            ". J - 7 | .",
            ". x X . - .",
            ". L | | . X",
            "X - X L X .",
            ". - . 7 7 .",
            "- - X . | .",
            ". F | | - .",
            "X X X X E X"
            ]
        },
// Level 3
        {
    maxInventoryCapacity: 5,
    initialInventory: ['|', 'L'],
    map: [
            "X X S X X . . X",
            ". . T . . . . .",
            ". F X 7 | . . X",
            "| J X - . . . X",
            "- 7 X | . . . |",
            "X . . . . . . X",
            "X X E X . . . X"
    ]
    },
// Level 4
    {
    maxInventoryCapacity: 5,
    initialInventory: ['|', 'L'],
    map: [
            "X X S X X . . X",
            ". . . . . . . .",
            ". F X 7 | . . X",
            "| J X - . . . X",
            ". . . . . . . .",
            "- T X | . . . |",
            "X . . . . . . X",
            ". . . . . . . .",
            "X X E X . . . X"
    ]
    }
];
