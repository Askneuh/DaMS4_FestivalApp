export interface FestivalGameRow {
    id: number;
    name: string;
    author: string;
    editorName: string;
    gameTypeLabel: string;
    reservedQuantity: number;
    isGamePlaced: boolean; // Actually derived from boolean in backend, might come as boolean or 0/1 depending on driver, but usually boolean in node-postgres
    planAreas: { id: number; name: string }[];
}
