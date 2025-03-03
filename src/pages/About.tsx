import { Moon, Sun } from "lucide-react";
import { useTheme } from "../ThemeContext";

export function About() {
    const {theme, toggleTheme} = useTheme();

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