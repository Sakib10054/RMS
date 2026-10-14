
package restaurant_management.repository;

import restaurant_management.entity.Payment;
import restaurant_management.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(Long orderId);

    List<Payment> findByPaymentStatus(PaymentStatus paymentStatus);

    List<Payment> findByOrderCustomerId(Long customerId);

    boolean existsByOrderId(Long orderId);
}