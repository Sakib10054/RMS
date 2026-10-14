package restaurant_management.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import restaurant_management.entity.ReservationItem;

import java.util.List;

public interface ReservationItemRepository extends JpaRepository<ReservationItem, Long> {
    List<ReservationItem> findByReservationId(Long reservationId);
}
