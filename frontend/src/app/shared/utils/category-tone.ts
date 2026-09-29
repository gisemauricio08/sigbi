//Las categorías sin clase propia en styles.css caen al tono neutro.
const TONOS = new Set([
    'narrativa',
    'informatica',
    'ciencia',
    'historia',
    'infantil',
    'hemeroteca',
]);

//Informática lleva tilde en la base de datos y no en la clase CSS
const normalizar = (nombre: string) =>
    nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();

const clase = (prefijo: string, nombre: string | null | undefined) => {
    if (!nombre) return prefijo;

    const clave = normalizar(nombre);

    return TONOS.has(clave) ? `${prefijo} ${prefijo}--${clave}` : prefijo;
};

export function categoryToneClass(nombre: string | null | undefined): string {
    return clase('sigbi-cat', nombre);
}

//Paso intermedio y no el fondo del chip: este da 1,1:1 sobre el panel; el intermedio, >= 3:1.
export function chartToneClass(nombre: string | null | undefined): string {
    return clase('sigbi-chart', nombre);
}
