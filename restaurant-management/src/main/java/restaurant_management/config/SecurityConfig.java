package restaurant_management.config;

import restaurant_management.security.CustomUserDetailsService;
import restaurant_management.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500}")
    private String allowedOrigins;

    public SecurityConfig(
            CustomUserDetailsService customUserDetailsService,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.customUserDetailsService = customUserDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // =========================================================
    // PASSWORD ENCODER
    // =========================================================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // =========================================================
    // AUTHENTICATION PROVIDER
    // =========================================================

    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(customUserDetailsService);

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    // =========================================================
    // AUTHENTICATION MANAGER
    // =========================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }

    // =========================================================
    // CORS CONFIGURATION
    // =========================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(
                java.util.Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isEmpty())
                        .distinct()
                        .toList()
        );

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        config.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }

    // =========================================================
    // SECURITY FILTER CHAIN
    // =========================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                // -------------------------------------------------
                // CORS
                // -------------------------------------------------
                .cors(Customizer.withDefaults())

                // -------------------------------------------------
                // CSRF
                // JWT based API হওয়ায় CSRF disable
                // -------------------------------------------------
                .csrf(csrf -> csrf.disable())

                // -------------------------------------------------
                // SESSION
                // JWT ব্যবহার করছি, তাই STATELESS
                // -------------------------------------------------
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // -------------------------------------------------
                // AUTHENTICATION PROVIDER
                // -------------------------------------------------
                .authenticationProvider(
                        authenticationProvider()
                )

                // -------------------------------------------------
                // AUTHORIZATION
                // -------------------------------------------------
                .authorizeHttpRequests(auth -> auth

                        // =================================================
                        // OPTIONS / CORS
                        // =================================================

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()


                        // Recipe images are public; payment proofs are never public.
                        .requestMatchers(HttpMethod.GET, "/uploads/recipes/**").permitAll()

                        // The controller enforces proof ownership or staff/manager access.
                        .requestMatchers(HttpMethod.GET, "/api/payments/*/proof-file")
                        .hasAnyRole("CUSTOMER", "STAFF", "MANAGER")

                        // =================================================
                        // AUTHENTICATION
                        // Login / Register etc.
                        // =================================================

                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()


                        // =================================================
                        // USER PROFILE
                        // =================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/me"
                        ).authenticated()


                        // User management = MANAGER only
                        .requestMatchers(
                                "/api/users/**"
                        ).hasRole("MANAGER")


                        // =================================================
                        // INGREDIENTS
                        // =================================================

                        // Everyone authenticated can view ingredients
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/ingredients/**"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "STAFF",
                                "MANAGER"
                        )

                        // Only STAFF + MANAGER can create/update/delete
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/ingredients/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/ingredients/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/ingredients/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/ingredients/**"
                        ).hasRole("MANAGER")


                        // =================================================
                        // RECIPES
                        // =================================================

                        // Everyone can view recipes
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/recipes/**"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "STAFF",
                                "MANAGER"
                        )

                        // Only MANAGER can manage recipes
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/recipes/**"
                        ).hasRole("MANAGER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/recipes/**"
                        ).hasRole("MANAGER")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/recipes/**"
                        ).hasRole("MANAGER")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/recipes/**"
                        ).hasRole("MANAGER")


                        // =================================================
                        // ORDERS
                        // =================================================

                        // CUSTOMER + STAFF + MANAGER can create orders
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/orders"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "STAFF",
                                "MANAGER"
                        )

                        // Only STAFF + MANAGER can update order status
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/orders/*/status"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/orders/*/status"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )

                        // View orders
                        // Ownership checking is handled inside
                        // OrderServiceImpl for CUSTOMER.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/orders/**"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "STAFF",
                                "MANAGER"
                        )


                        // =================================================
                        // CUSTOMER ORDER LOOKUP
                        // =================================================

                        // Service layer checks that CUSTOMER can
                        // only access their own customer ID.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/orders/customer/**"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "STAFF",
                                "MANAGER"
                        )


                        // =================================================
                        // INVENTORY
                        // =================================================

                        .requestMatchers(
                                "/api/inventory/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )


                        // =================================================
                        // PURCHASES
                        // =================================================

                        .requestMatchers(
                                "/api/purchases/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )


                        // =================================================
                        // STOCK ALERTS
                        // =================================================

                        .requestMatchers(
                                "/api/stock-alerts/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )


                        // =================================================
                        // STOCK MOVEMENTS
                        // =================================================

                        .requestMatchers(
                                "/api/stock-movements/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )


                        // =================================================
                        // PAYMENTS
                        // =================================================

                        // Customers can submit and view their own payment proofs.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/payments"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/payments/mine"
                        ).hasRole("CUSTOMER")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/payments/proof"
                        ).hasRole("CUSTOMER")

                        // Payment administration remains STAFF + MANAGER only.
                        .requestMatchers(
                                "/api/payments/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )


                        // =================================================
                        // TABLES
                        // =================================================

                        // Everyone can see available tables
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/tables/**"
                        ).hasAnyRole(
                                "CUSTOMER",
                                "STAFF",
                                "MANAGER"
                        )

                        // STAFF + MANAGER can create/update
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tables/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/tables/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/tables/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )

                        // Only MANAGER can delete
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/tables/**"
                        ).hasRole("MANAGER")




                        // =================================================
                        // RESERVATIONS
                        // =================================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reservations"
                        ).hasRole("CUSTOMER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations/me"
                        ).hasRole("CUSTOMER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reservations/*/cancel"
                        ).hasRole("CUSTOMER")

                        // STAFF + MANAGER can review customer reservation requests
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations"
                        ).hasAnyRole("STAFF", "MANAGER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reservations/*/confirm"
                        ).hasAnyRole("STAFF", "MANAGER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reservations/*/reject"
                        ).hasAnyRole("STAFF", "MANAGER")


                        // =================================================
                        // DASHBOARD
                        // =================================================

                        .requestMatchers(
                                "/api/dashboard/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )


                        // =================================================
                        // REPORTS
                        // =================================================

                        .requestMatchers(
                                "/api/reports/**"
                        ).hasAnyRole(
                                "STAFF",
                                "MANAGER"
                        )


                        // =================================================
                        // EVERYTHING ELSE
                        // =================================================

                        // Any endpoint not explicitly listed above
                        // still requires authentication.
                        .anyRequest().authenticated()
                )

                // =================================================
                // JWT FILTER
                // =================================================

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}