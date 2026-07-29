import React, { useState, useEffect } from 'react';
import { apiGetStats, apiGetSolicitud, apiActualizarEstatus, getCurrentUser } from '../../../shared/services/api';
import KpiCardsGrid from '../components/kpis/KpiCardsGrid';
import WelcomeHero from '../components/WelcomeHero';
import SectoresPresupuesto from '../components/presupuestos/SectoresPresupuesto';
import DrawerLateralSector from '../components/presupuestos/DrawerLateralSector';
import AjustarPresupuestoModal from '../components/presupuestos/AjustarPresupuestoModal';
import DrawerLateralProductores from '../components/presupuestos/DrawerLateralProductores';
import ExpedienteDetalleModal from '../../solicitudes/components/ExpedienteDetalleModal';
import { toast } from '../../../shared/utils/toast';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowRight, PieChart, MapPin } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
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
        label: "ANÁLISIS DE DATOS",
        title: "PANEL ESTRATÉGICO",
        iconKey: "DASHBOARD",
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
      console.error("Error al cargar detalle de solicitud:", error);
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
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando Panel Estratégico...</span>
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
      {/* 1. Hero de Bienvenida Institucional */}
      <WelcomeHero 
        currentUser={currentUser} 
        resumen={resumen} 
      />

      {/* 2. Cuadrícula de KPIs Ejecutivos Clave */}
      <KpiCardsGrid 
        resumen={resumen} 
        onShowProductores={() => setShowProductoresDrawer(true)} 
      />

      {/* 3. Secciones de Monitoreo Financiero por Sector */}
      <div>
        <SectoresPresupuesto 
          modulos={modulos}
          onAdjustPresupuesto={() => setShowBudgetModal(true)}
          onSelectSector={(sectId) => setSelectedSector(sectId)}
        />
      </div>



      {/* Drawer de Inspección por Sector */}
      {selectedSector && (
        <DrawerLateralSector
          sectorKey={selectedSector}
          modulos={modulos}
          onClose={() => setSelectedSector(null)}
          onOpenDetail={handleOpenDetail}
        />
      )}

      {/* Drawer del Padrón de Productores */}
      {showProductoresDrawer && (
        <DrawerLateralProductores
          onClose={() => setShowProductoresDrawer(false)}
          onOpenDetail={handleOpenDetail}
        />
      )}

      {/* Modal de Ajuste Presupuestal */}
      {showBudgetModal && (
        <AjustarPresupuestoModal
          modulos={modulos}
          onClose={() => setShowBudgetModal(false)}
          onSuccess={() => {
            fetchStats();
            toast.success("Presupuestos sectoriales actualizados.");
          }}
        />
      )}

      {/* Modal de Detalle del Expediente */}
      {selectedSolicitud && (
        <ExpedienteDetalleModal
          selectedSolicitud={selectedSolicitud}
          setSelectedSolicitud={setSelectedSolicitud}
          newEstatus={newEstatus}
          setNewEstatus={setNewEstatus}
          estatusComentario={estatusComentario}
          setEstatusComentario={setEstatusComentario}
          updateLoading={updateLoading}
          handleUpdateEstatus={handleUpdateEstatus}
        />
      )}
    </div>
  );
}
