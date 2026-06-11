import { useAuth } from "../../store/auth.store";
import { useClientData } from "./hooks/useClientData";
import { NuevaAtencionSection } from "./sections/NuevaAtencionSection";
import { MisReparacionesSection } from "./sections/MisReparacionesSection";

export function ClientPage() {
  const auth = useAuth();
  const firstName = auth.user?.name.split(" ")[0] ?? "Cliente";

  const {
    services,
    workers,
    slots,
    reservations,
    devices,
    reservationForm,
    deviceForm,
    photoForm,
    expandedDeviceId,
    error,
    success,
    loading,
    selectedWorker,
    setExpandedDeviceId,
    updateReservationForm,
    updateDeviceForm,
    updatePhotoForm,
    handleCreateReservation,
    handleCreateDevice,
    handleCreatePhoto,
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
        devices={devices}
        deviceForm={deviceForm}
        error={error}
        loading={loading}
        photoForm={photoForm}
        reservationForm={reservationForm}
        selectedWorker={selectedWorker}
        services={services}
        slots={slots}
        success={success}
        workers={workers}
        onCreateDevice={handleCreateDevice}
        onCreatePhoto={handleCreatePhoto}
        onCreateReservation={handleCreateReservation}
        onDeviceFormChange={updateDeviceForm}
        onPhotoFormChange={updatePhotoForm}
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
