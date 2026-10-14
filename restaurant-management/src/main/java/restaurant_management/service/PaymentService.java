
package restaurant_management.service;

import restaurant_management.entity.Payment;
import restaurant_management.entity.Order;
import restaurant_management.enums.PaymentStatus;
import restaurant_management.enums.PaymentMethod;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PaymentService {

    Payment createPayment(Payment payment);

    Payment submitPaymentProof(Long orderId, PaymentMethod paymentMethod, String proofReference, String proofNote, MultipartFile proofFile);

    Payment getPaymentById(Long id);

    Payment getPaymentByOrderId(Long orderId);

    List<Payment> getAllPayments();

    List<Payment> getCurrentCustomerPayments();

    List<Payment> getPaymentsByStatus(PaymentStatus paymentStatus);

    Payment updatePaymentStatus(Long id, PaymentStatus paymentStatus);

    Payment rejectPaymentProof(Long id);

    Payment createAutomaticPaymentIfEligible(Order order);
}