import { useApp } from "../AppContext";
import "../styles/Settings.css";

export function Settings() {
    const { theme, setTheme, tableStyle, setTableStyle, mapPositionMode, setMapPositionMode } = useApp();

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
                    <select id="theme" className="form-select-inline" value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}>
                        <option value="light">Claro</option>
                        <option value="dark">Oscuro</option>
                    </select>
                </div>
                <div className="settings-content-inline">
                    <label htmlFor="tableStyle" className="form-label-inline">Estilo de tabla:</label>
                    <select id="tableStyle" className="form-select-inline" value={tableStyle} onChange={(e) => setTableStyle(e.target.value as "regular" | "grouped")}>
                        <option value="regular">Mostrar por orden</option>
                        <option value="grouped">Agrupar por línea</option>
                    </select>
                </div>
                <div className="settings-content-inline">
                    <label htmlFor="mapPositionMode" className="form-label-inline">Posición del mapa:</label>
                    <select id="mapPositionMode" className="form-select-inline" value={mapPositionMode} onChange={e => setMapPositionMode(e.target.value as 'gps' | 'last')}>
                        <option value="gps">Posición GPS</option>
                        <option value="last">Donde lo dejé</option>
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
                <a href="https://github.com/arielcostas/urbanovigo-web" className="about-link" rel="nofollow noreferrer noopener">
                    Código en GitHub
                </a> -
                Desarrollado por <a href="https://www.costas.dev" className="about-link" rel="nofollow noreferrer noopener">
                    Ariel Costas
                </a>
            </p>
            <p>
                Datos obtenidos de <a href="https://datos.vigo.org" className="about-link" rel="nofollow noreferrer noopener">datos.vigo.org</a> bajo
                licencia <a href="https://opendefinition.org/licenses/odc-by/" className="about-link" rel="nofollow noreferrer noopener">Open Data Commons Attribution License</a>
            </p>
        </div>
    )
}