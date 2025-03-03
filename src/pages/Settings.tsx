import { useApp } from "../AppContext";
import "../styles/Settings.css";

export function Settings() {
    const { theme, setTheme, tableStyle, setTableStyle } = useApp();

    return (
        <div className="about-page">
            <h1 className="page-title">Sobre UrbanoVigo Web</h1>
            <p className="about-description">
                Aplicación web para encontrar paradas y tiempos de llegada de los autobuses
                urbanos de Vigo, España.
            </p>
            <section className="settings-section">
                <h2>Ajustes</h2>
                <div className="settings-content-inline">
                    <label htmlFor="theme" className="form-label-inline">Modo:</label>
                    <select id="theme" className="form-select-inline" value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                        style={{ backgroundColor: theme === "dark" ? "#333" : "#fff", color: theme === "dark" ? "#fff" : "#000" }}>
                        <option value="light">Claro</option>
                        <option value="dark">Oscuro</option>
                    </select>
                </div>
                <div className="settings-content-inline">
                    <label htmlFor="tableStyle" className="form-label-inline">Estilo de tabla:</label>
                    <select id="tableStyle" className="form-select-inline" value={tableStyle} onChange={(e) => setTableStyle(e.target.value as "regular" | "grouped")}
                        style={{ backgroundColor: theme === "dark" ? "#333" : "#fff", color: theme === "dark" ? "#fff" : "#000" }}>
                        <option value="regular">Mostrar por orden</option>
                        <option value="grouped">Agrupar por línea</option>
                    </select>
                </div>
                <details className="form-details">
                    <summary>¿Qué significa esto?</summary>
                    <p>
                        La tabla de horarios puede mostrarse de dos formas:
                    </p>
                    <dl>
                        <dt>Mostrar por orden</dt>
                        <dd>Las paradas se muestran en el orden en que se visitan. Aplicaciones como Infobus (Vitrasa) usan este estilo.</dd>
                        <dt>Agrupar por línea</dt>
                        <dd>Las paradas se agrupan por la línea de autobús. Aplicaciones como iTranvias (A Coruña) o Moovit (más o menos) usan este estilo.</dd>
                    </dl>
                </details>
            </section>
            <h2>Créditos</h2>
            <p>
                <a href="https://github.com/arielcostas/urbanovigo-web" className="about-link" style={{ color: theme === "dark" ? "#bbb" : "#000" }}>
                    Código en GitHub
                </a> -
                Desarrollado por <a href="https://www.costas.dev" className="about-link" style={{ color: theme === "dark" ? "#bbb" : "#000" }}>
                    Ariel Costas
                </a>
            </p>
            <p>
                Datos obtenidos de <a href="https://datos.vigo.org" style={{ color: theme === "dark" ? "#bbb" : "#000" }}>datos.vigo.org</a> bajo
                licencia <a href="https://opendefinition.org/licenses/odc-by/" style={{ color: theme === "dark" ? "#bbb" : "#000" }}>Open Data Commons Attribution License</a>
            </p>
        </div>
    )
}