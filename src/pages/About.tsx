import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function About() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme as 'light' | 'dark';
        }
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <div className="about-page">
            <h1 className="page-title">Sobre UrbanoVigo Web</h1>
            <p className="about-description">
                Aplicación web para encontrar paradas y tiempos de llegada de los autobuses
                urbanos de Vigo, España.
            </p>
            <button className="form-button" onClick={toggleTheme}>
                {theme === 'light' ?
                    <><Moon size={24} /> Usar modo oscuro</> :
                    <><Sun size={24} /> Usar modo claro</>
                }
            </button>
            <p>
                <a href="https://github.com/arielcostas/urbanovigo-web" className="about-link">
                    Código en GitHub
                </a> -
                Desarrollado por <a href="https://www.costas.dev" className="about-link">
                    Ariel Costas
                </a>
            </p>
            <p>
                Datos obtenidos de <a href="https://datos.vigo.org">datos.vigo.org</a> bajo 
                licencia <a href="https://opendefinition.org/licenses/odc-by/">Open Data Commons Attribution License</a>
            </p>
        </div>
    )
}