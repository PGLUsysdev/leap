# LEAP - Technical Manual

## System Architecture

### Technology Stack

**Backend:**
- Laravel Framework 12 (PHP 8.2+)
- Laravel Fortify for authentication
- Inertia.js for server-side driven SPAs
- MySQL/PostgreSQL database

**Frontend:**
- React 19.2.4
- Inertia.js React adapter
- TypeScript 5.9.3
- TailwindCSS 4.2.2
- Vite 8.0.1 for asset bundling
- Radix UI components
- shadcn/ui component library

**Development Tools:**
- Bun for package management
- Composer for PHP dependencies
- Prettier for code formatting
- Oxlint for linting
- Vitest for testing

## Installation

### Prerequisites

- PHP 8.2 or higher
- Composer 2.x
- Bun 1.x or Node.js 20+
- MySQL 8.0+ or PostgreSQL 14+
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leap
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install JavaScript dependencies**
   ```bash
   bun install
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure database**
   Edit `.env` file and set your database credentials:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=leap
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

6. **Run database migrations**
   ```bash
   php artisan migrate
   ```

7. **Build frontend assets**
   ```bash
   bun run build
   ```

8. **Start the development server**
   ```bash
   bun run dev
   ```

   Or use the composer script:
   ```bash
   composer run dev
   ```
   This will start:
   - PHP artisan server (port 8000)
   - Queue listener
   - Vite dev server (port 5173)

## Configuration

### Environment Variables

Key environment variables in `.env`:

- `APP_NAME`: Application name
- `APP_ENV`: Environment (local, production)
- `APP_KEY`: Application encryption key
- `APP_URL`: Application URL
- `APP_DEBUG`: Debug mode (true/false)

Database settings:
- `DB_CONNECTION`: Database driver (mysql, pgsql, sqlite)
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_DATABASE`: Database name
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password

Session and security:
- `SESSION_DRIVER`: Session driver (file, database, redis)
- `BCRYPT_ROUNDS`: Password hashing rounds

### Application Configuration

Configuration files are located in the `config/` directory:

- `config/app.php`: Application settings
- `config/database.php`: Database connections
- `config/auth.php`: Authentication configuration
- `config/fortify.php`: Laravel Fortify settings
- `config/inertia.php`: Inertia.js configuration
- `config/cors.php`: CORS settings

## Database Schema

### Core Tables

**Users**
- `id`: Primary key
- `name`: User full name
- `email`: User email (unique)
- `password`: Encrypted password
- `office_id`: Foreign key to offices table
- `is_admin`: Admin flag
- `status`: User status (pending, active, inactive)
- `email_verified_at`: Email verification timestamp
- `remember_token`: Remember me token
- Timestamps: `created_at`, `updated_at`

**Fiscal Years**
- `id`: Primary key
- `year`: Fiscal year (e.g., 2025)
- `status`: Status (active, inactive)
- Timestamps

**AIP Entries**
- `id`: Primary key
- `fiscal_year_id`: Foreign key to fiscal_years
- `ppa_id`: Foreign key to ppas
- `start_date`: Project start date
- `end_date`: Project end date
- `expected_output`: Expected project output
- `ps_amount`: Personal Services allocation (decimal)
- `mooe_amount`: MOOE allocation (decimal)
- `fe_amount`: Financial Expenses allocation (decimal)
- `co_amount`: Capital Outlay allocation (decimal)
- `total_amount`: Total allocation (decimal)
- Timestamps

**PPAs (Programs, Projects, Activities)**
- `id`: Primary key
- `office_id`: Foreign key to offices
- `parent_id`: Self-referencing foreign key for hierarchy
- `name`: PPA name
- `type`: PPA type (program, project, activity)
- `code_suffix`: Code suffix for full code generation
- `is_active`: Active status flag
- Timestamps

**PPMP Items**
- `id`: Primary key
- `aip_entry_id`: Foreign key to aip_entries
- `ppmp_price_list_id`: Foreign key to ppmp_price_lists
- `funding_source_id`: Foreign key to funding_sources
- `quantity`: Total quantity (decimal)
- Monthly quantity fields: `jan_qty` through `dec_qty` (decimal)
- Monthly amount fields: `jan_amount` through `dec_amount` (decimal)
- Timestamps

**Offices**
- `id`: Primary key
- `sector_id`: Foreign key to sectors
- `lgu_level_id`: Foreign key to lgu_levels
- `office_type_id`: Foreign key to office_types
- `code`: Office code
- `name`: Office name
- `acronym`: Office acronym
- `is_lee`: LEE status flag
- Timestamps

**Sectors**
- `id`: Primary key
- `name`: Sector name
- `code`: Sector code
- Timestamps

**LGU Levels**
- `id`: Primary key
- `name`: Level name (Provincial, City, Municipal, Barangay)
- `code`: Level code
- Timestamps

**Office Types**
- `id`: Primary key
- `name`: Office type name
- `code`: Office type code
- Timestamps

**Funding Sources**
- `id`: Primary key
- `name`: Funding source name
- `description`: Description
- Timestamps

**Chart of Accounts**
- `id`: Primary key
- `account_code`: Account code
- `account_name`: Account name
- `expense_class`: Expense class (PS, MOOE, FE, CO)
- `account_group_id`: Foreign key to account_groups
- Timestamps

**PPMP Price Lists**
- `id`: Primary key
- `description`: Item description
- `unit_of_measurement`: Unit (e.g., pcs, kg, lot)
- `price`: Unit price (decimal)
- `ppmp_category_id`: Foreign key to ppmp_categories
- `chart_of_account_id`: Foreign key to chart_of_accounts
- Timestamps

**PPMP Categories**
- `id`: Primary key
- `name`: Category name
- Timestamps

## API Routes

### Authentication Routes (Laravel Fortify)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset

### AIP Management
- `GET /aip` - List fiscal years
- `POST /aip` - Create fiscal year
- `PATCH /aip/{fiscal_year}` - Update fiscal year
- `PATCH /aip/{fiscal_year}/status` - Update fiscal year status
- `GET /aip/{fiscalYear}/summary` - View AIP summary
- `POST /aip/{fiscalYear}/import` - Import AIP entries
- `PUT /aip-entries/{aipEntry}` - Update AIP entry
- `DELETE /aip-entries/{aipEntry}` - Delete AIP entry

### PPA Management
- `GET /aip-ppa` - List PPAs
- `POST /aip-ppa` - Create PPA
- `PATCH /aip-ppa/{aip_ppa}` - Update PPA
- `DELETE /aip-ppa/{aipPpa}` - Delete PPA

### PPMP Management
- `GET /aip/{fiscalYear}/summary/{aipEntry}/ppmp` - View PPMP for AIP entry
- `POST /ppmp` - Create PPMP item
- `POST /ppmp/custom` - Create custom PPMP item
- `PUT /ppmp/{ppmp}/update-monthly-quantity` - Update monthly quantities
- `DELETE /ppmp/{ppmp}` - Delete PPMP item

### Master Data
- `GET /funding-sources` - List funding sources
- `POST /funding-sources` - Create funding source
- `PATCH /funding-sources/{fundingSource}` - Update funding source
- `DELETE /funding-sources/{fundingSource}` - Delete funding source

- `GET /chart-of-accounts` - List chart of accounts
- `POST /chart-of-accounts` - Create account
- `PATCH /chart-of-accounts/{chartOfAccount}` - Update account
- `DELETE /chart-of-accounts/{chartOfAccount}` - Delete account

- `GET /price-lists` - List price lists
- `POST /price-lists` - Create price list item
- `PATCH /price-lists/{ppmpPriceList}` - Update price list item
- `DELETE /price-lists/{ppmpPriceList}` - Delete price list item

- `GET /ppmp-categories` - List PPMP categories
- `POST /ppmp-categories` - Create category
- `PATCH /ppmp-categories/{ppmpCategory}` - Update category
- `DELETE /ppmp-categories/{ppmpCategory}` - Delete category

### Organizational Structure
- `GET /sectors` - List sectors
- `POST /sectors` - Create sector
- `PATCH /sectors/{sector}` - Update sector
- `DELETE /sectors/{sector}` - Delete sector

- `GET /lgu-levels` - List LGU levels
- `POST /lgu-levels` - Create LGU level
- `PATCH /lgu-levels/{lguLevel}` - Update LGU level
- `DELETE /lgu-levels/{lguLevel}` - Delete LGU level

- `GET /office-types` - List office types
- `POST /office-types` - Create office type
- `PATCH /office-types/{officeType}` - Update office type
- `DELETE /office-types/{officeType}` - Delete office type

- `GET /offices` - List offices
- `POST /offices` - Create office
- `PATCH /offices/{office}` - Update office
- `DELETE /offices/{office}` - Delete office

### User Management (Admin Only)
- `GET /users` - List users
- `PATCH /users/{user}/status` - Update user status
- `PATCH /admin/users/{user}/approve` - Approve user registration

## Development

### Running Tests

Run the test suite:
```bash
composer run test
```

Or using Pest:
```bash
./vendor/bin/pest
```

### Code Formatting

Format PHP code:
```bash
composer run pint
```

Format JavaScript/TypeScript code:
```bash
bun run format
```

### Linting

Lint JavaScript/TypeScript code:
```bash
bun run lint
```

Fix linting issues:
```bash
bun run lint:fix
```

Type checking:
```bash
bun run types:check
```

### Building for Production

Build frontend assets:
```bash
bun run build
```

Build with SSR:
```bash
bun run build:ssr
```

Optimize application:
```bash
php artisan optimize
```

## Deployment

### Production Checklist

1. **Set environment variables**
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Configure production database
   - Set appropriate `APP_URL`

2. **Run migrations**
   ```bash
   php artisan migrate --force
   ```

3. **Build assets**
   ```bash
   bun run build
   ```

4. **Optimize application**
   ```bash
   php artisan optimize
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

5. **Set proper file permissions**
   - `storage/` directory should be writable
   - `bootstrap/cache/` directory should be writable

6. **Configure queue worker**
   ```bash
   php artisan queue:work --daemon
   ```

### Server Requirements

- PHP 8.2 or higher
- Required PHP extensions: bcmath, ctype, fileinfo, json, mbstring, openssl, pdo, tokenizer, xml
- MySQL 8.0+ or PostgreSQL 14+
- Composer 2.x
- Node.js 20+ or Bun 1.x
- Web server (Apache, Nginx, or PHP built-in server)

### SSL Configuration

Configure SSL for production:
- Obtain SSL certificate
- Configure web server (Apache/Nginx)
- Force HTTPS in application by setting `APP_URL` to https://
- Configure trusted proxies if behind load balancer

## Maintenance

### Database Backups

Run database backup:
```bash
php artisan db:backup
```

Or use mysqldump:
```bash
mysqldump -u username -p database_name > backup.sql
```

### Log Management

Application logs are stored in `storage/logs/`. Monitor and rotate logs regularly.

Clear application logs:
```bash
php artisan log:clear
```

### Cache Management

Clear application cache:
```bash
php artisan cache:clear
```

Clear configuration cache:
```bash
php artisan config:clear
```

Clear route cache:
```bash
php artisan route:clear
```

Clear view cache:
```bash
php artisan view:clear
```

### Queue Management

Monitor queue jobs:
```bash
php artisan queue:monitor
```

Clear failed jobs:
```bash
php artisan queue:flush
```

Retry failed jobs:
```bash
php artisan queue:retry all
```

## Security

### Authentication

- Laravel Fortify handles authentication
- Two-factor authentication support
- Password encryption using bcrypt
- Session management

### Authorization

- Role-based access control (Admin, Regular User)
- Middleware protection for sensitive routes
- Admin-only routes for user management

### Data Validation

- Server-side validation using Laravel validation rules
- Client-side validation using Zod schemas
- Input sanitization

### Security Best Practices

- Keep dependencies updated
- Use HTTPS in production
- Implement rate limiting
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Enable CSRF protection
- Configure CORS properly
- Regular security audits
- Monitor logs for suspicious activity

## Troubleshooting

### Common Issues

**Migration errors**
- Check database connection in `.env`
- Ensure database exists
- Verify database user has proper permissions

**Asset build failures**
- Clear node_modules and reinstall: `rm -rf node_modules && bun install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check for conflicting dependencies

**Queue jobs not processing**
- Ensure queue worker is running
- Check queue configuration
- Verify queue connection in `.env`

**Session issues**
- Check session driver configuration
- Verify storage directory permissions
- Clear session cache

**Permission errors**
- Ensure storage directory is writable: `chmod -R 775 storage`
- Ensure bootstrap/cache is writable: `chmod -R 775 bootstrap/cache`

### Debug Mode

Enable debug mode in `.env`:
```
APP_DEBUG=true
```

View detailed error messages in browser logs.

### Logging

Check application logs:
```bash
tail -f storage/logs/laravel.log
```

## Support

For technical issues or questions:
- Check Laravel documentation: https://laravel.com/docs
- Check Inertia.js documentation: https://inertiajs.com
- Check React documentation: https://react.dev
- Review application logs in `storage/logs/`
