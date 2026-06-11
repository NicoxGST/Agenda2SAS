import { useWorkerData } from "./hooks/useWorkerData";
import { AvailabilitySection } from "./sections/AvailabilitySection";
import { ReservationsSection } from "./sections/ReservationsSection";
import { DevicesSection } from "./sections/DevicesSection";

export function WorkerPage() {
  const {
    isWorker,
    canPickWorker,
    workers,
    availability,
    reservations,
    clients,
    devices,
    selectedClientId,
    clientSearch,
    editingDeviceId,
    expandedDeviceId,
    error,
    loading,
    availabilityForm,
    deviceForm,
    setClientSearch,
    setExpandedDeviceId,
    updateAvailabilityForm,
    updateDeviceForm,
    handleCreateAvailability,
    handleToggleAvailability,
    handleDeleteAvailability,
    handleReservationStatus,
    handleSearchClients,
    handleClientSelect,
    startEditingDevice,
    resetDeviceForm,
    handleSaveDevice,
    handleDevicePhotoAdded,
    handleDevicePhotoDeleted,
  } = useWorkerData();

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Panel trabajador</span>
        <h2>Agenda y reservas</h2>
        <p>
          Administra la disponibilidad semanal, confirma citas y gestiona
          equipos y órdenes de trabajo.
        </p>
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

      {isWorker && (
        <ReservationsSection
          reservations={reservations}
          onStatusChange={handleReservationStatus}
        />
      )}

      <DevicesSection
        clientSearch={clientSearch}
        clients={clients}
        deviceForm={deviceForm}
        devices={devices}
        editingDeviceId={editingDeviceId}
        expandedDeviceId={expandedDeviceId}
        loading={loading}
        selectedClientId={selectedClientId}
        onClientSearchChange={setClientSearch}
        onClientSelect={handleClientSelect}
        onDeviceFormChange={updateDeviceForm}
        onExpandDevice={setExpandedDeviceId}
        onPhotoAdded={handleDevicePhotoAdded}
        onPhotoDeleted={handleDevicePhotoDeleted}
        onResetForm={resetDeviceForm}
        onSave={handleSaveDevice}
        onSearch={handleSearchClients}
        onStartEditing={startEditingDevice}
      />
    </>
  );
}
