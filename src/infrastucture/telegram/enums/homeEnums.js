export const Entrances = {
    ENTRANCE_1: '1',
    ENTRANCE_2: '2',
    ENTRANCE_3: '3',
    ENTRANCE_4: '4',
    ENTRANCE_5: '5',
    ENTRANCE_6: '6'
};

export const Floors = Array.from({ length: 15 }, (_, i) => `Поверх ${i + 1}`);

export const ApartmentsPerFloor = {
    1: 5, // 1-й поверх
    6: 5, // 6-й поверх
    default: 4 // Інші поверхи
};
