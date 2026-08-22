import React, { useState, useEffect } from 'react';
import { apiGetStats, apiGetSolicitud, apiActualizarEstatus, getCurrentUser } from '../../../shared/services/api';
import KpiCardsGrid from '../components/kpis/KpiCardsGrid';
import SectoresPresupuesto from '../components/presupuestos/SectoresPresupuesto';
import DrawerLateralSector from '../components/presupuestos/DrawerLateralSector';
import AjustarPresupuestoModal from '../components/presupuestos/AjustarPresupuestoModal';
import DrawerLateralProductores from '../components/presupuestos/DrawerLateralProductores';
import SectoresSolicitudes from '../components/charts/SectoresSolicitudes';
import EstatusDonutChart from '../components/charts/EstatusDonutChart';
import MapaNayaritReal from '../components/mapas/MapaNayaritReal';
import ExpedienteDetalleModal from '../../solicitudes/components/ExpedienteDetalleModal';
import { toast } from '../../../shared/utils/toast';
import { BarChart3, PieChart, MapPin, RefreshCw, Layers, TrendingUp } from 'lucide-react';

export default function EstadisticasPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showProductoresDrawer, setShowProductoresDrawer] = useState(false);

  // Estados para la modal de detalle de expediente
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [newEstatus, setNewEstatus] = useState('');
  const [estatusComentario, setEstatusComentario] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const currentUser = getCurrentUser();

  const fetchStats = async () => {
    try {
      const data = await apiGetStats();
      setStats(data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Notificar al navbar superior
    window.dispatchEvent(new CustomEvent('sdr-navbar-update', {
      detail: {
        label: "CENTRO DE ANALÍTICA ESTRATÉGICA",
        title: "ESTADÍSTICAS Y ANÁLISIS FINANCIERO",
        iconKey: "ESTADISTICAS",
        actions: [
          { id: "actualizar", text: "Actualizar" },
          ...(currentUser?.role !== 'ANALISTA' ? [{ id: "navigate-registrar", text: "Nueva Solicitud" }] : [])
        ]
      }
    }));

    const handleActualizar = () => {
      setRefreshing(true);
      fetchStats();
    };

    window.addEventListener('sdr-navbar-action-actualizar', handleActualizar);
    return () => {
      window.removeEventListener('sdr-navbar-action-actualizar', handleActualizar);
    };
  }, []);

  const handleOpenDetail = async (solId) => {
    setModalLoading(true);
    try {
      const detail = await apiGetSolicitud(solId);
      setSelectedSolicitud(detail);
      setNewEstatus(detail.status);
      setEstatusComentario('');
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      toast.error("Error al cargar el expediente.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateEstatus = async (e) => {
    e.preventDefault();
    if (!newEstatus) return;

    setUpdateLoading(true);
    try {
      const updated = await apiActualizarEstatus(selectedSolicitud.id, newEstatus, estatusComentario);
      await handleOpenDetail(updated.id);
      fetchStats();
      toast.success("Estatus del expediente actualizado con éxito.");
    } catch (error) {
      console.error("Error al actualizar estatus:", error);
      toast.error("Error al actualizar estatus.");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 border-4 border-nayarit-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando Centro de Analítica y Estadísticas...</span>
      </div>
    );
  }

  const { resumen, estatus, modulos, municipios } = stats || {
    resumen: { totalSolicitudes: 0, inversionTotal: 0, inversionAprobada: 0, beneficiarios: { hombres: 0, mujeres: 0, organizaciones: 0, total: 0 } },
    estatus: [],
    modulos: [],
    municipios: []
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* 1. KPIs Financieros y Operativos Globales */}
      <div>
        <KpiCardsGrid 
          resumen={resumen} 
          onShowProductores={() => setShowProductoresDrawer(true)} 
        />
      </div>

      {/* 2. Monitoreo Financiero y Techos Presupuestales por Sector */}
      <div>
        <SectoresPresupuesto 
          modulos={modulos}
          onAdjustPresupuesto={() => setShowBudgetModal(true)}
          onSelectSector={(sectId) => setSelectedSector(sectId)}
        />
      </div>

      {/* 3. Gráficas Principales: Distribución por Sector vs Estatus de Trámites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SectoresSolicitudes 
            modulos={modulos} 
            totalSolicitudes={resumen.totalSolicitudes}
            onSelectSector={(sectId) => setSelectedSector(sectId)}
          />
        </div>
        <div className="lg:col-span-1">
          <EstatusDonutChart 
            estatus={estatus} 
            totalSolicitudes={resumen.totalSolicitudes} 
          />
        </div>
      </div>

      {/* 4. Mapa Geográfico de Distribución Territorial de Nayarit */}
      <div>
        <MapaNayaritReal municipios={municipios} />
      </div>

      {/* Drawer de Inspección Detallada por Sector */}
      {selectedSector && (
        <DrawerLateralSector
          sectorKey={selectedSector}
          modulos={modulos}
          onClose={() => setSelectedSector(null)}
          onOpenDetail={handleOpenDetail}
        />
      )}

      {/* Drawer de Inspección de Productores Beneficiarios */}
      {showProductoresDrawer && (
        <DrawerLateralProductores
          beneficiarios={resumen.beneficiarios}
          onClose={() => setShowProductoresDrawer(false)}
        />
      )}

      {/* Modal de Ajuste de Presupuesto Anual */}
      {showBudgetModal && (
        <AjustarPresupuestoModal
          modulos={modulos}
          onClose={() => setShowBudgetModal(false)}
          onSuccess={() => {
            fetchStats();
            toast.success("Presupuestos actualizados con éxito.");
          }}
        />
      )}

      {/* Modal de Detalle del Expediente */}
      {selectedSolicitud && (
        <ExpedienteDetalleModal
          solicitud={selectedSolicitud}
          loading={modalLoading}
          onClose={() => setSelectedSolicitud(null)}
          currentUser={currentUser}
          newEstatus={newEstatus}
          setNewEstatus={setNewEstatus}
          estatusComentario={estatusComentario}
          setEstatusComentario={setEstatusComentario}
          updateLoading={updateLoading}
          onUpdateEstatus={handleUpdateEstatus}
        />
      )}
    </div>
  );
}
