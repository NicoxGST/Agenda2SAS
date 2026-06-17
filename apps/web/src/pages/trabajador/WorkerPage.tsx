import { useWorkerData } from "./hooks/useWorkerData";
import { AvailabilitySection } from "./sections/AvailabilitySection";

export function WorkerPage() {
  const {
    canPickWorker,
    workers,
    availability,
    error,
    loading,
    availabilityForm,
    updateAvailabilityForm,
    handleCreateAvailability,
    handleToggleAvailability,
    handleDeleteAvailability,
  } = useWorkerData();

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Panel trabajador</span>
        <h2>Mi Agenda</h2>
        <p>Administra tu disponibilidad semanal.</p>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      <AvailabilitySection
        availability={availability}
        canPickWorker={canPickWorker}
        form={availabilityForm}
        loading={loading}
        workers={workers}
        onCreate={handleCreateAvailability}
        onDelete={handleDeleteAvailability}
        onFormChange={updateAvailabilityForm}
        onToggle={handleToggleAvailability}
      />
    </>
  );
}
