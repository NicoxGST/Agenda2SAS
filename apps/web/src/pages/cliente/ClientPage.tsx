import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth.store";
import { useClientData } from "./hooks/useClientData";
import { NuevaAtencionSection } from "./sections/NuevaAtencionSection";
import { MisReparacionesSection } from "./sections/MisReparacionesSection";

export function ClientPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = sessionStorage.getItem('pendingPaymentRef');
    if (ref) {
      sessionStorage.removeItem('pendingPaymentRef');
      navigate(`/pago/exito?ref=${encodeURIComponent(ref)}`);
    }
  }, [navigate]);
  const firstName = auth.user?.name.split(" ")[0] ?? "Cliente";

  const {
    services,
    workers,
    slots,
    reservations,
    devices,
    reservationForm,
    expandedDeviceId,
    error,
    loading,
    loadingSlots,
    availableDaysOfWeek,
    availableDates,
    selectedWorker,
    setExpandedDeviceId,
    updateReservationForm,
    handleCheckout,
    handleDevicePhotoAdded,
    handleDevicePhotoDeleted,
  } = useClientData();

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Portal cliente</span>
        <h2>Hola, {firstName}</h2>
        <p>
          Gestiona tus reservas, equipos y sigue el estado de tus reparaciones.
        </p>
      </div>

      <NuevaAtencionSection
        availableDaysOfWeek={availableDaysOfWeek}
        availableDates={availableDates}
        error={error}
        loading={loading}
        loadingSlots={loadingSlots}
        reservationForm={reservationForm}
        selectedWorker={selectedWorker}
        services={services}
        slots={slots}
        workers={workers}
        onCheckout={handleCheckout}
        onReservationFormChange={updateReservationForm}
      />

      <MisReparacionesSection
        devices={devices}
        expandedDeviceId={expandedDeviceId}
        reservations={reservations}
        onExpandDevice={setExpandedDeviceId}
        onPhotoAdded={handleDevicePhotoAdded}
        onPhotoDeleted={handleDevicePhotoDeleted}
      />
    </>
  );
}
