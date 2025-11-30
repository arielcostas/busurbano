export interface LineInfo {
	lineNumber: string;
	routeName: string;
	scheduleUrl: string;
}

/**
 * Sourced from https://vitrasa.es/lineas-y-horarios/todas-las-lineas
 *
    Array.from(document.querySelectorAll(".line-information")).map(el => {
        return {
            lineNumber: el.querySelector(".square-info").innerText,
            routeName: el.querySelector(".all-lines-descripcion-prh").innerText,
            scheduleUrl: `https://vitrasa.es/documents/5893389/6130928/${el.querySelector("input[type=checkbox]").value}.pdf`
        }
    });

 */


export const VIGO_LINES: LineInfo[] = [
    {
        "lineNumber": "C1",
        "routeName": "P.América - C. Castillo - P.Sanz - G.Via - P.América",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/1.pdf"
    },
    {
        "lineNumber": "C3d",
        "routeName": "Bouzas/Coia - E.Fadrique - Encarnación (dereita) - Pza España - Bouzas/Coia",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/3001.pdf"
    },
    {
        "lineNumber": "C3i",
        "routeName": "Bouzas/Coia - Pza España - Encarnación (esquerda) - E.Fadrique - Bouzas/Coia",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/3002.pdf"
    },
    {
        "lineNumber": "4A",
        "routeName": "Coia - Camelias - Centro - Aragón",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/4001.pdf"
    },
    {
        "lineNumber": "4C",
        "routeName": "Coia - Camelias - Centro - M.Garrido - Gregorio Espino",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/4003.pdf"
    },
    {
        "lineNumber": "5A",
        "routeName": "Navia - Florida - L.Mora - Urzaiz - T.Vigo - Teis",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/5001.pdf"
    },
    {
        "lineNumber": "5B",
        "routeName": "Navia - Coia - L.Mora - Pi Margall - G.Barbón - Teis",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/5004.pdf"
    },
    {
        "lineNumber": "6",
        "routeName": "H.Cunqueiro - Beade - Bembrive - Pza. España",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/6.pdf"
    },
    {
        "lineNumber": "7",
        "routeName": "Zamans/Valladares - Fragoso - P.América - P.España - Centro",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/7.pdf"
    },
    {
        "lineNumber": "9B",
        "routeName": "Centro - Choróns - San Cristovo - Rabadeira",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/9002.pdf"
    },
    {
        "lineNumber": "10",
        "routeName": "Teis - G.Barbón - Torrecedeira - Av. Atlántida - Samil - Vao - Saiáns",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/10.pdf"
    },
    {
        "lineNumber": "11",
        "routeName": "San Miguel - Vao - P. América - Urzaiz - Ramón Nieto - Grileira",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/11.pdf"
    },
    {
        "lineNumber": "12A",
        "routeName": "Saiáns - Muiños - Castelao - Pi Margall - P.España - H.Meixoeiro",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/1201.pdf"
    },
    {
        "lineNumber": "12B",
        "routeName": "H.Cunqueiro - Castrelos - Camelias - P.España - H.Meixoeiro",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/1202.pdf"
    },
    {
        "lineNumber": "13",
        "routeName": "Navia - Bouzas - Gran Vía - P.España - H.Meixoeiro",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/13.pdf"
    },
    {
        "lineNumber": "14",
        "routeName": "Gran Vía - Miraflores - Moledo - Chans",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/14.pdf"
    },
    {
        "lineNumber": "15A",
        "routeName": "Av. Ponte - Choróns - Gran Vía - Castelao - Navia - Samil",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/1501.pdf"
    },
    {
        "lineNumber": "15B",
        "routeName": "Xestoso - Choróns - P.Sanz - Beiramar - Bouzas - Samil",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/1506.pdf"
    },
    {
        "lineNumber": "15C",
        "routeName": "CUVI - Choróns - P.Sanz - Torrecedeira - Bouzas - Samil",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/1507.pdf"
    },
    {
        "lineNumber": "16",
        "routeName": "Coia - Balaídos - Zamora - P.España - Colón - Guixar",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/16.pdf"
    },
    {
        "lineNumber": "17",
        "routeName": "Matamá/Freixo - Fragoso - Camelias - G.Barbón - Ríos/A Guía",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/17.pdf"
    },
    {
        "lineNumber": "18A",
        "routeName": "AREAL/COLÓN - SÁRDOMA/POULEIRA",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/18.pdf"
    },
    {
        "lineNumber": "18B",
        "routeName": "URZAIZ / P.ESPAÑA - POULEIRA",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/1801.pdf"
    },
    {
        "lineNumber": "18H",
        "routeName": "URZAIZ / P. ESPAÑA - H. ALV. CUNQUEIRO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/1802.pdf"
    },
    {
        "lineNumber": "23",
        "routeName": "M. ECHEGARAY - Balaídos - Gran Vía - Choróns - Gregorio Espino",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/23.pdf"
    },
    {
        "lineNumber": "24",
        "routeName": "Poulo - Vía Norte - Colón - Guixar",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/24.pdf"
    },
    {
        "lineNumber": "25",
        "routeName": "PZA. ESPAÑA – SABAXÁNS / CAEIRO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/25.pdf"
    },
    {
        "lineNumber": "27",
        "routeName": "BEADE (C. CULTURAL) – RABADEIRA",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/27.pdf"
    },
    {
        "lineNumber": "28",
        "routeName": "VIGOZOO - SAN PAIO - BOUZAS",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/28.pdf"
    },
    {
        "lineNumber": "29",
        "routeName": "FRAGOSELO / S. ANDRÉS – PZA. ESPAÑA",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/29.pdf"
    },
    {
        "lineNumber": "31",
        "routeName": "SAN LOURENZO – HOSP. MEIXOEIRO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/31.pdf"
    },
    {
        "lineNumber": "A",
        "routeName": "ARENAL – PORTO / UNIVERSIDADE",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/8.pdf"
    },
    {
        "lineNumber": "H",
        "routeName": "NAVIA - BOUZAS - HOSPITAL ALVARO CUNQUEIRO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/104.pdf"
    },
    {
        "lineNumber": "H1",
        "routeName": "POLICARPO SANZ – HOSPITAL ÁLVARO CUNQUEIRO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/101.pdf"
    },
    {
        "lineNumber": "H2",
        "routeName": "GREGORIO ESPINO – HOSPITAL ÁLVARO CUNQU",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/102.pdf"
    },
    {
        "lineNumber": "H3",
        "routeName": "GARCÍA BARBÓN – HOSPITAL ÁLVARO CUNQUEIRO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/105.pdf"
    },
    {
        "lineNumber": "LZD",
        "routeName": "STELLANTIS - ALV. CUNQUEIRO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/751.pdf"
    },
    {
        "lineNumber": "N1",
        "routeName": "SAMIL – BUENOS AIRES",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/30.pdf"
    },
    {
        "lineNumber": "N4",
        "routeName": "NAVIA - G. ESPINO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/3305.pdf"
    },
    {
        "lineNumber": "PSA1",
        "routeName": "STELLANTIS - G.BARBON",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/301.pdf"
    },
    {
        "lineNumber": "PSA4",
        "routeName": "STELLANTIS - G. BARBON",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/4004.pdf"
    },
    {
        "lineNumber": "PTL",
        "routeName": "PARQUE TECNOLÓXICO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/304.pdf"
    },
    {
        "lineNumber": "TUR",
        "routeName": "TURISTICO",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/500.pdf"
    },
    {
        "lineNumber": "U1",
        "routeName": "LANZADEIRA PZA. AMÉRICA – UNIVERSIDADE",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/201.pdf"
    },
    {
        "lineNumber": "U2",
        "routeName": "LANZADEIRA PZA. DE ESPAÑA – UNIVERSIDADE",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/202.pdf"
    },
    {
        "lineNumber": "VTS",
        "routeName": "CABRAL - BASE",
        "scheduleUrl": "https://vitrasa.es/documents/5893389/6130928/3010.pdf"
    }
];
