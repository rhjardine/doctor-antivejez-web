/**
 * Contenido base de la Guía de Alimentación Nutrigenómica
 * Doctor Antivejez — Extraído de la guía clínica oficial
 * Solo contenido impreso — sin anotaciones manuales
 */

export const DEFAULTS_O_B = {
    grupoSanguineo: 'O_B' as const,

    desayuno: [
        'Pan sin gluten',
        'Cereales de trigo sarraceno o avena sin gluten',
        'Creps de yuca',
        'Suero de leche (Whey protein)',
        'Huevo revuelto con vegetales y queso de cabra',
        'Huevo escalfado con verduras al vapor',
        'Huevo duro cocido con tiras de queso de cabra',
        'Omelette de clara de huevo con champiñones',
        'Infusiones o café sin azúcar',
    ],

    almuerzo: [
        'Carnes rojas o blancas',
        'Ensaladas',
        'Granos',
        'Pasticho de berenjena con carne',
        'Tomate relleno con carne molida',
        'Rissoto o ñoquis',
        'Pizza de casabe con queso de cabra',
        'Kibbe con ensalada Fatush',
        'Lomito con jojoticos chinos',
    ],

    cena: {
        comunes: [
            'Ensaladas de sardinas, salmón o mariscos',
            'Sushi', 'Ceviche', 'Antipasto', 'Carpaccio',
        ],
        especifico: 'Keto o Paleo',
    },
};

export const DEFAULTS_A_AB = {
    grupoSanguineo: 'A_AB' as const,

    desayuno: [
        'Cereales de trigo sarraceno o avena sin gluten',
        'Tortilla de huevo con avena s/g',
        'Creps de avena s/g',
        'Leche de soya o almendras',
        'Infusiones o café sin azúcar',
    ],

    almuerzo: [
        'Carnes blancas',
        'Ensaladas',
        'Granos',
        'Pastillo de berenjena con pollo',
        'Tomate relleno con pollo',
        'Pasta sin gluten',
        'Pizza de coliflor con queso de cabra',
        'Falafel con ensalada Tabulé de quinoa',
        'Pollo a la naranja con ensalada budda',
    ],

    cena: {
        comunes: [
            'Ensaladas de sardinas, salmón o mariscos',
            'Sushi', 'Ceviche', 'Antipasto', 'Carpaccio',
        ],
        especifico: 'Vegano o Vegetariano',
    },
};

export const DEFAULTS_COMUNES = {
    meriendas: [
        'Gelatina de lámina o 1 cda de polvo sin sabor en infusión con stevia o limón (GELATE)',
        '7 Semillas: almendras, nueces, pistacho, merey, auyama tostada',
        'Batido de proteína: 1 cda de suero o ricotta sin sal, whey protein o soy protein',
        'Helado Vegano (leche de almendras o coco)',
        'Tableta de Cacao Antivejez 100%',
    ],

    ensaladasLibres: [
        'Hojas verdes', 'Berenjenas', 'Calabacines', 'Pepinos', 'Tomates',
        'Pimentones', 'Brócoli', 'Champiñones', 'Alcachofas',
        'Germinados', 'Espárragos', 'Rábanos',
    ],

    aderezos: [
        'Vinagreta balsámica', 'Yogurt con perejil', 'Aceite de oliva',
    ],

    bebidas: [
        'Agua mineral con o sin limón', 'Soda con limón', 'Infusiones frías',
    ],

    actividadFisica: {
        manana: {
            titulo: 'MAÑANA — 30 minutos antes del ejercicio',
            items: [
                'TERMO: café, té o cacao',
                '2 cápsulas de Fat Burner',
                '1 cucharadita de aceite TRIOIL',
            ],
        },
        tarde: {
            titulo: 'TARDE — Antes, durante o después del ejercicio',
            items: [
                'TERMO: Café o Té verde',
                'Whey protein o Vegan Protein',
                'Agua de limón',
                'Agua con vinagre de manzana',
            ],
        },
    },

    alimentosEvitar: `Cochino y sus derivados, atún, pez espada, grasas, frituras, huevos fritos.
Caseína: lácteos de vaca o búfala, parmesano.
Enlatados con preservativos, refrescos, azúcar, edulcorantes, chucherías.
Harinas refinadas y sus derivados, cereales refinados.
Jugos naturales, papaya, mango, banana, melón, patilla, piña (máximo una vez por semana).
Tubérculos.
Gluten: trigo, avena, cebada, centeno integral.`,

    sustitutos: `Carnes a la plancha, sancocho o al horno.
Huevos sancochados, revueltos o en agua.
Quesos blancos, fresco o yogurt de cabra.
Leches vegetales (soya, almendra, coco).
Infusiones de plantas: malojillo, toronjil, té verde, café.
Frutas frescas o secas, harinas integrales.
Germinados, verduras frescas.
Semillas tostadas: almendras, avellanas, nueces, merey, ajonjolí.
Enlatados en agua o aceite. Suero o ricota sin sal.
Lácteos de cabra, Pecorino o Manchego.
Productos sin gluten: pan, maíz, fororo, arroz, yuca, plátano, papa, batata, granola, avena.`,

    combinaciones: {
        desayuno: {
            alimentos: [
                'Frutas', 'Granola', 'Lácteos de cabra o semilla', 'Huevos',
                'Casabe', 'Concha', 'Arepa Integral', 'Tortillas de maíz o arroz',
            ],
            semillas: ['Ajonjolí', 'Linaza', 'Chía', 'Quinoa'],
        },
        almuerzo: {
            advertencia: 'Proteínas → EVITAR MEZCLAR CON → Carbohidratos Integrales',
            proteinas: ['Carnes', 'Huevos', 'Quesos de cabra', 'Soya'],
            grasasBuenas: ['Aceite de coco', 'Aguacate', 'Aceite de oliva extravirgen', 'TRIOIL'],
            carbohidratos: ['Arroz', 'Maíz', 'Plátano', 'Yuca', 'Batata'],
            combinarCon: ['Granos', 'Vegetales frescos'],
            sinGluten: ['Maíz', 'Arroz', 'Quinoa', 'Lenteja', 'Garbanzo'],
        },
        cena: {
            descripcion: 'Ensaladas y proteínas ligeras',
            opciones: [
                'Sardinas', 'Salmón', 'Cangrejo', 'Huevos sancochados',
                'Quesos de cabra', 'Antipasto', 'Ceviche', 'Sushi', 'Carpaccio',
            ],
        },
    },

    claves5a: [
        {
            clave: 'ALIMENTACIÓN Sana',
            icono: '🥗',
            items: [
                'Frutas de Bajo Índice Glicémico en el desayuno: manzana, pera, cerezas, fresas, moras, uvas, ciruela, kiwi, grapefruit, toronja, naranja.',
                'AYUNO INTERMITENTE: cenar temprano y tomar un termo de café, té verde o cacao kero (con aceite TRIOIL) hasta el mediodía del día siguiente (2-3 veces por semana).',
                'Tomar de 6-8 vasos de agua de limón o infusiones fuera de las comidas (con agua mineral).',
                'Merienda: a media mañana y media tarde.',
            ],
        },
        {
            clave: 'ACTIVIDAD Física',
            icono: '🏃',
            items: [
                'Actividad física 3 a 6 veces por semana, 1-2 horas al día.',
                '10 minutos de calentamiento.',
                '20 minutos CARDIOVASCULAR en la mañana para bajar grasa corporal, o en la tarde para aumentar masa muscular.',
                'MUSCULACIÓN con ligas, mancuernas, pesos 10 minutos. Estiramiento.',
                'Frecuencia Cardíaca de Entrenamiento = (220 - edad) × 60-80%.',
            ],
        },
        {
            clave: 'ASUETO Reparador',
            icono: '😴',
            items: [
                'Reposo Reparador: acostarse antes de las 10 PM y dormir de 6 a 8 horas.',
                'Recrearse periódicamente: playa, montaña, llano, spas.',
            ],
        },
        {
            clave: 'ACTITUD Adecuada',
            icono: '🧘',
            items: [
                'Cultivar pensamientos y sentimientos positivos frente al estrés.',
            ],
        },
        {
            clave: 'AMBIENTE Armónico',
            icono: '🏡',
            items: [
                'Crear un ambiente de familia y trabajo lo más armónico posible.',
                'Evitar estimulantes, licor o cigarrillo para obtener máximos resultados.',
                'En reuniones sociales: soda con limón o una copa de vino tinto o Kombucha.',
            ],
        },
    ],

    frase: 'Amado(a), deseo que seas prosperado(a) en todas las cosas, y que tengas salud (3 Juan 2)',
};
