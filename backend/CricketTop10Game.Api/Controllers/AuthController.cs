using CricketTop10Game.Api.Dtos;
using CricketTop10Game.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CricketTop10Game.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly AdminAuthService _adminAuthService;

    public AuthController(AdminAuthService adminAuthService)
    {
        _adminAuthService = adminAuthService;
    }

    [HttpPost("admin/token")]
    public IActionResult GetAdminToken([FromBody] AdminLoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (!_adminAuthService.ValidateAdminCredentials(request.Username, request.Password))
        {
            return Problem(detail: "Invalid credentials", statusCode: StatusCodes.Status401Unauthorized);
        }

        var (accessToken, expiresAtUtc) = _adminAuthService.GenerateToken(request.Username);
        return Ok(new AdminTokenResponseDto
        {
            AccessToken = accessToken,
            ExpiresAtUtc = expiresAtUtc
        });
    }
}
