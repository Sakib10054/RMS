package restaurant_management.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CreateReservationRequest {
    @NotNull
    private Long tableId;
    @NotNull
    @Future
    private LocalDateTime reservationDateTime;
    @NotNull
    @Positive
    private Integer guestCount;
    private String note;
    @Valid
    private List<ReservationRecipeRequest> items = new ArrayList<>();

    public Long getTableId() { return tableId; }
    public void setTableId(Long tableId) { this.tableId = tableId; }
    public LocalDateTime getReservationDateTime() { return reservationDateTime; }
    public void setReservationDateTime(LocalDateTime reservationDateTime) { this.reservationDateTime = reservationDateTime; }
    public Integer getGuestCount() { return guestCount; }
    public void setGuestCount(Integer guestCount) { this.guestCount = guestCount; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public List<ReservationRecipeRequest> getItems() { return items; }
    public void setItems(List<ReservationRecipeRequest> items) { this.items = items; }
}
