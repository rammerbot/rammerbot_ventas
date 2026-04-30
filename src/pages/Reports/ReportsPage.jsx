import React, { useState, useEffect } from 'react';
import { BASE_URL, getHeaders } from '../../services/apiUtils';
import './ReportsPage.css';
import { FileSpreadsheet, Printer, Calendar, List, PieChart, Activity } from 'lucide-react';

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState('monthly');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportType, setReportType] = useState('X');
    
    const [monthlyData, setMonthlyData] = useState(null);
    const [dailyData, setDailyData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchMonthly = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/reports/sales-book?month=${month}&year=${year}`, {
                headers: getHeaders()
            });
            const result = await response.json();
            setMonthlyData(result);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchDaily = async (type = 'X') => {
        setLoading(true);
        setReportType(type);
        try {
            const response = await fetch(`${BASE_URL}/reports/daily-summary?date=${selectedDate}&report_type=${type}`, {
                headers: getHeaders()
            });
            const result = await response.json();
            setDailyData(result);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (activeTab === 'monthly') fetchMonthly();
        else fetchDaily('X');
    }, [activeTab]);

    const exportToExcel = () => {
        if (!monthlyData) return;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fecha,RIF/CI,Cliente,Factura,Control,Tipo,Afecta,Base Imp,IVA,IGTF,Total\n";
        monthlyData.entries.forEach(e => {
            csvContent += `${new Date(e.date).toLocaleDateString()},${e.customer_rif},${e.customer_name},${e.invoice_number},${e.control_number},${e.type},${e.related_number || ''},${e.base_imponible.toFixed(2)},${e.iva_amount.toFixed(2)},${e.igtf_amount.toFixed(2)},${e.total_with_iva.toFixed(2)}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Libro_Ventas_${month}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="reports-page">
            <header className="reports-header no-print">
                <h1>📊 Reportes Fiscales</h1>
                <div className="tab-navigation">
                    <button className={activeTab === 'monthly' ? 'tab active' : 'tab'} onClick={() => setActiveTab('monthly')}>
                        <List size={18} /> Libro de Ventas
                    </button>
                    <button className={activeTab === 'daily' ? 'tab active' : 'tab'} onClick={() => setActiveTab('daily')}>
                        <PieChart size={18} /> Reportes X / Z
                    </button>
                </div>
            </header>

            {activeTab === 'monthly' ? (
                <div className="tab-content">
                    <div className="reports-controls card no-print">
                        <div className="control-group">
                            <label>Periodo Fiscal</label>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                        <button className="btn-primary" onClick={fetchMonthly} disabled={loading}>Consultar Libro</button>
                    </div>

                    {monthlyData && (
                        <div className="sales-book-container card">
                            <div className="book-meta">
                                <div>
                                    <h2>Libro de Ventas Mensual</h2>
                                    <p style={{color: '#7e8299'}}>Periodo: {month}/{year}</p>
                                </div>
                                <div className="branch-info">
                                    <span><strong>{monthlyData.branch_name}</strong></span>
                                    <span>RIF: {monthlyData.branch_rif}</span>
                                </div>
                            </div>

                            <table className="sales-book-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>RIF/CI</th>
                                        <th>Cliente</th>
                                        <th>N° Factura</th>
                                        <th>Tipo</th>
                                        <th>Base Imp.</th>
                                        <th>IVA</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyData.entries.map((e, i) => (
                                        <tr key={i} className={e.type.includes('DEV') ? 'row-dev' : ''}>
                                            <td>{new Date(e.date).toLocaleDateString()}</td>
                                            <td>{e.customer_rif}</td>
                                            <td>{e.customer_name}</td>
                                            <td>{e.invoice_number}</td>
                                            <td>{e.type}</td>
                                            <td align="right">${e.base_imponible.toFixed(2)}</td>
                                            <td align="right">${e.iva_amount.toFixed(2)}</td>
                                            <td align="right"><strong>${e.total_with_iva.toFixed(2)}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="report-actions no-print">
                                <button className="btn-success" onClick={exportToExcel}><FileSpreadsheet size={18}/> Excel</button>
                                <button className="btn-secondary" onClick={() => window.print()}><Printer size={18}/> PDF</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="tab-content">
                    <div className="reports-controls card no-print">
                        <div className="control-group">
                            <label>Fecha del Reporte</label>
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button className="btn-primary" style={{background: '#6610f2'}} onClick={() => fetchDaily('X')} disabled={loading}>
                                <Activity size={18}/> GENERAR REPORTE X
                            </button>
                            <button className="btn-primary" style={{background: '#181c32'}} onClick={() => fetchDaily('Z')} disabled={loading}>
                                <PieChart size={18}/> GENERAR REPORTE Z
                            </button>
                        </div>
                    </div>

                    {dailyData && (
                        <div className="daily-report-container card">
                            <div className="report-header-print">
                                <h2 style={{margin: '0 0 10px 0'}}>REPORTE DE LECTURA FISCAL "{dailyData.type}"</h2>
                                <p style={{fontWeight: 'bold', fontSize: '1.2rem'}}>REPORTE N° {String(dailyData.numero).padStart(4, '0')}</p>
                                <div style={{textAlign: 'left', fontSize: '0.9rem', margin: '15px 0'}}>
                                    <div><strong>EMPRESA:</strong> {dailyData.branch.name}</div>
                                    <div><strong>RIF:</strong> {dailyData.branch.rif}</div>
                                    <div><strong>DIR:</strong> {dailyData.branch.address}</div>
                                    <div><strong>TEL:</strong> {dailyData.branch.phone}</div>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #000', paddingTop: '10px'}}>
                                    <span>FECHA: {new Date(dailyData.date).toLocaleDateString()}</span>
                                    <span>HORA: {dailyData.time}</span>
                                </div>
                                <hr style={{border: '1px dashed #000'}} />
                            </div>

                            <div className="daily-stats">
                                <div className="stat-row">
                                    <span>PRIMERA FACTURA:</span>
                                    <strong>{dailyData.range.first || 'N/A'}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>ÚLTIMA FACTURA:</span>
                                    <strong>{dailyData.range.last || 'N/A'}</strong>
                                </div>
                                <hr style={{border: '1px dashed #000'}} />
                                <div className="stat-row">
                                    <span>CANT. FACTURAS:</span>
                                    <strong>{dailyData.summary.counts.facturas}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>CANT. NOTAS CRED:</span>
                                    <strong>{dailyData.summary.counts.notas_credito}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>ANULACIONES:</span>
                                    <strong>{dailyData.summary.counts.anulaciones}</strong>
                                </div>
                                <hr style={{border: '1px dashed #000'}} />
                                <div className="stat-row">
                                    <span>VENTAS EXENTAS:</span>
                                    <strong>${dailyData.summary.exento.toFixed(2)}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>BASE IMPONIBLE (16%):</span>
                                    <strong>${dailyData.summary.base.toFixed(2)}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>IVA TOTAL:</span>
                                    <strong>${dailyData.summary.iva.toFixed(2)}</strong>
                                </div>
                                <div className="stat-row">
                                    <span>IGTF TOTAL (3%):</span>
                                    <strong>${dailyData.summary.igtf.toFixed(2)}</strong>
                                </div>
                                <div className="stat-row total" style={{borderTop: '2px double #000'}}>
                                    <span>TOTAL GENERAL:</span>
                                    <strong>${dailyData.summary.total.toFixed(2)}</strong>
                                </div>
                            </div>

                            <div className="report-actions no-print" style={{marginTop: '30px'}}>
                                <button className="btn-secondary" onClick={() => window.print()}><Printer size={18}/> IMPRIMIR {dailyData.type}</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
