using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CricketTop10Game.Api.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CricketTop10Game.Api.Services;

public class AdminAuthService
{
    private readonly AdminAuthOptions _adminOptions;
    private readonly JwtOptions _jwtOptions;

    public AdminAuthService(IOptions<AdminAuthOptions> adminOptions, IOptions<JwtOptions> jwtOptions)
    {
        _adminOptions = adminOptions.Value;
        _jwtOptions = jwtOptions.Value;
    }

    public bool ValidateAdminCredentials(string username, string password)
    {
        return string.Equals(username, _adminOptions.Username, StringComparison.Ordinal) &&
               string.Equals(password, _adminOptions.Password, StringComparison.Ordinal);
    }

    public (string AccessToken, DateTime ExpiresAtUtc) GenerateToken(string username)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpiryMinutes);
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, "admin")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
