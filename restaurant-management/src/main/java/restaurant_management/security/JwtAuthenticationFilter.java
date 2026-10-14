package restaurant_management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authorizationHeader =
                request.getHeader("Authorization");

        String jwt = null;
        String email = null;

        if (authorizationHeader != null
                && authorizationHeader.startsWith("Bearer ")) {

            jwt = authorizationHeader.substring(7).trim();

            if (!jwt.isEmpty()) {
                try {
                    email = jwtService.extractUsername(jwt);
                } catch (Exception ignored) {
                    /*
                     * Invalid JWT will simply continue
                     * without authentication.
                     */
                }
            }
        }

        if (email != null
                && SecurityContextHolder.getContext()
                .getAuthentication() == null) {

            try {

                UserDetails userDetails =
                        userDetailsService
                                .loadUserByUsername(email);

                /*
                 * IMPORTANT:
                 *
                 * CustomUserDetailsService maps the user's
                 * database active status to UserDetails.enabled.
                 *
                 * Therefore, even if an old JWT is still
                 * cryptographically valid, an inactive user
                 * must NOT be authenticated.
                 */
                if (!userDetails.isEnabled()) {
                    filterChain.doFilter(
                            request,
                            response
                    );
                    return;
                }

                if (jwtService.isTokenValid(
                        jwt,
                        userDetails
                )) {

                    UsernamePasswordAuthenticationToken
                            authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(
                                    authentication
                            );
                }

            } catch (Exception ignored) {
                /*
                 * Authentication must not be created when
                 * the user cannot be loaded or the token
                 * cannot be validated.
                 */
            }
        }

        filterChain.doFilter(request, response);
    }
}

