export const Entrances = {
    ENTRANCE_1: '1',
    ENTRANCE_2: '2',
    ENTRANCE_3: '3',
    ENTRANCE_4: '4',
    ENTRANCE_5: '5',
    ENTRANCE_6: '6'
};

export const Floors = Array.from({ length: 15 }, (_, i) => `${i + 1}`);

export const entranceApartments = {
    1: [1, 75],
    2: [76, 135],
    3: [136, 195],
    4: [196, 255],
    5: [256, 315],
    6: [316, 390],
};

export const ApartmentsPerFloor = {
    '1': 5,
    '6': 5,
    default: 4
};
