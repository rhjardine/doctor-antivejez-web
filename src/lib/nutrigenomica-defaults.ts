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

    terapias4r: [
        {
            nombre: 'Remoción',
            slogan: 'Elimina lo que te sobra',
            descripcion: 'Las homotoxinas son moléculas de desecho orgánico o inorgánico, generadas por el propio organismo o que ingresan por alguna vía al cuerpo humano. Al hacerlo inmediatamente se activan los mecanismos de detoxificación y desintoxicación que buscan detectar, neutralizar, aislar, movilizar y eliminar las toxinas, a través de las vías correspondientes según su naturaleza, las cuales pueden ser físicas, químicas, biológicas, orgánicas e inorgánicas (Ernst& Schmidt 2004).',
            infoExtra: 'Las principales terapias de remoción están enfocadas en tratar de una manera efectiva las siguientes formas de homotoxicosis:',
            items: ['Oxidación', 'Acidez', 'Caramelización', 'Calcificación', 'Contaminación']
        },
        {
            nombre: 'Revitalización',
            slogan: 'Recupera lo que te hace falta',
            descripcion: 'Las terapias de revitalización consisten en aportar al organismo lo que le hace falta para recuperar su metabolismo normal, mantener o incluso optimizarlo a escalas superiores, según la necesidad de cada persona, tales como la experimentación de altos niveles de estrés, el entrenamiento intensivo, una preparación quirúrgica o estados de convalecencia después de una enfermedad.',
            infoExtra: 'Al determinar cuál es el metabolismo que se debe revitalizarse seleccionan los sustratos, minerales, oligoelementos, vitaminas, fitofármacos, inductores enzimáticos, entre otros, para reactivar su funcionamiento y recuperar, mantener u optimizar la salud (Guarente 2011).',
            items: []
        },
        {
            nombre: 'Regeneración',
            slogan: 'Revertir las lesiones',
            descripcion: 'Estas terapias están destinadas a regenerar sistemas, aparatos, órganos o tejidos que han entrado en una fase degenerativa, dado que han perdido su capacidad de recuperarse por sí mismos y ameritan un tratamiento específico para restaurar su función o su estructura (Mason Dunnill 2008).',
            infoExtra: 'Las terapias más reconocidas en Medicina Regenerativa son:',
            items: [
                'Terapia Celular Hidrolizada: extractos de tejidos embrionarios de animales sanos de laboratorio, que aportan biomoléculas prefabricadas complejas y completas para la regeneración de la función del órgano tratado (Hernández Ramírez 2006).',
                'Terapia Celular Liofilizada: células deshidratadas de tejidos embrionarios de animales sanos de laboratorio, que provee material celular completo a los órganos tratados (Hernández Ramírez P 2006).',
                'Terapia de Factores Autólogos: proveniente de las plaquetas del propio paciente e infiltradas en los tejidos degenerados para estimular su regeneración (Copeland et al.1990).',
                'Terapia de Células Madre: provenientes de la placenta, el cordón umbilical de recién nacidos o de la médula ósea, grasa o cualquier otro tejido del propio paciente, con el fin de sembrar una nueva población celular en el órgano en estado de degeneración (Fehrer & Lepperdinger 2005).'
            ]
        },
        {
            nombre: 'Restauración',
            slogan: 'Mantente joven, saludable y en forma',
            descripcion: 'El cultivo de las claves de la longevidad se basa los tratamientos que se indican a todos aquellos que han logrado mejorar su edad biológica, de forma tal que no dependan de los tratamientos complementarios anteriores, sino que cuiden su salud de manera óptima, con toques técnicos periódicos que le permitan contrarrestar el fenómeno normal de envejecimiento.',
            infoExtra: 'Podemos recordar las Claves de la Longevidad 5A:',
            items: [
                'Alimentación sana',
                'Actividad física regular',
                'Asueto, recreación periódica y descanso reparador',
                'Actitud mental y emocional proactiva',
                'Ambiente armónico',
                'Todo ello adaptado a las necesidades individuales y siguiendo las recomendaciones del médico antienvejecimiento'
            ]
        }
    ],

    frase: 'Amado(a), deseo que seas prosperado(a) en todas las cosas, y que tengas salud (3 Juan 2)',
};
