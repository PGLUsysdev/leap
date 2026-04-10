# LEAP - User Guide

## Overview

LEAP (Local Government Budget Planning System) is a comprehensive web application designed to help Local Government Units (LGUs) manage their annual investment programs, project planning, and procurement processes. The system streamlines budget allocation, project tracking, and procurement scheduling in a unified platform.

## Key Features

### 1. Annual Investment Program (AIP) Management

The Annual Investment Program (AIP) is the annual slice of the Local Development Investment Program (LDIP) which constitutes the total resource requirements for all Programs, Projects, and Activities (PPAs) consisting of the annual capital expenditure and regular operating requirements of the LGU. This module provides:

- **Fiscal Year Management**: Create and manage fiscal years with status tracking
- **AIP Entries**: Record project entries with detailed budget allocations across different expense categories
- **Budget Breakdown**: Track allocations across:
  - PS (Personal Services) - Budget allocation for personnel salaries and benefits
  - MOOE (Maintenance and Other Operating Expenses) - Budget for operational costs and maintaining an ideal level of service
  - FE (Financial Expenses) - Budget for financial charges and obligations
  - CO (Capital Outlay) - Budget for asset acquisition and infrastructure projects

### 2. Projects, Programs, and Activities (PPA)

Programs, Projects, and Activities (PPAs) are the ranked initiatives that become the bases for preparing annual budget proposals. LGUs establish priorities and allocate resources during investment programming of PPAs as major links to budgeting. This module provides:

- **Hierarchical Structure**: Organize projects in a tree structure (Program → Project → Activity)
- **Office Assignment**: Assign PPAs to specific offices responsible for implementation
- **Code Generation**: Automatic code generation based on office and hierarchy following the coding structure by type of LGU and office
- **Active/Inactive Status**: Enable or disable PPAs as needed for current fiscal planning

### 3. Procurement Project Management Plan (PPMP)

The inclusion of procurement planning in the preparation of the budget adds to the credibility of the budget inasmuch as the costing and programming of implementation are already initially determined as inputs to budget proposals. This module provides:

- **Monthly Planning**: Schedule procurement items across 12 months with detailed quantity and amount distribution
- **Quantity Tracking**: Plan quantities and amounts for each month to ensure timely delivery of public services
- **Price List Integration**: Link items to standardized price lists for accurate cost estimation
- **Funding Source Allocation**: Assign funding sources to procurement items consistent with LGC provisions

### 4. Master Data Management

Consistent with the provisions of the Local Government Code (LGC) and its Implementing Rules and Regulations, the AIP should indicate the PPAs for inclusion in the local government budget as well as in the budgets of NGAs or GOCCs concerned. This module provides:

- **Funding Sources**: Define and manage funding sources including:
  - General Fund (GF) Proper
  - GF – Special Account (SA) – 20% Development Fund (DF)
  - Other sources as prescribed by law
- **Chart of Accounts**: Maintain accounting codes and expense classifications based on the Revised Chart of Accounts for LGUs as prescribed under Commission on Audit Circular No. 2015-009
- **Price Lists**: Manage item prices, units of measurement, and categories for accurate procurement planning
- **PPMP Categories**: Organize procurement items by category aligned with sectoral allocations

### 5. Organizational Structure

The system follows the coding structure by type of LGU and office as prescribed in the Budget Operations Manual. This module provides:

- **Sectors**: Define major sectors aligned with the service falling under each sector pursuant to the New Government Accounting System of the Commission on Audit
- **LGU Levels**: Set up LGU levels (Provincial, City, Municipal) with different taxing powers as prescribed by the Local Government Code
- **Office Types**: Classify office types (e.g., Department, Office, Unit) following the standard coding structure
- **Offices**: Create and manage offices with hierarchical codes based on sector, LGU level, and office type combinations

### 6. User Management
- **User Accounts**: Create and manage user accounts
- **Role-Based Access**: Admin and regular user roles
- **Approval Workflow**: Admin approval required for new user activation
- **Status Management**: Activate or deactivate user accounts

## Getting Started

### Accessing the System

1. **Login**: Navigate to the application URL and log in with your credentials
2. **Dashboard**: After login, you'll see the main dashboard with navigation options
3. **Sidebar Navigation**: Use the sidebar to access different modules

### First-Time Setup

As a new user, you may need to:

1. **Register**: Create your user account through the registration page
2. **Wait for Approval**: Your account must be approved by an administrator before you can access the system
3. **Complete Your Profile**: Ensure your user profile is complete after approval
4. **Understand Your Role**: Know whether you're an admin or regular user
5. **Review Available Modules**: Explore the modules you have access to

## Module-by-Module Guide

### Dashboard

The dashboard provides:
- Quick access to main features
- Overview of system status
- Navigation to all modules

### AIP Management

#### Creating a Fiscal Year
1. Navigate to **AIP** from the sidebar
2. Click "Add Fiscal Year"
3. Enter the year (e.g., 2025)
4. Set the status (active/inactive)
5. Save the fiscal year

#### Managing AIP Entries
1. Select a fiscal year
2. View the summary of AIP entries
3. Import entries from PPAs or add manually
4. Edit budget allocations as needed
5. Update entry status

### PPA Management

#### Creating PPAs
1. Go to **AIP PPA** section
2. Click "Add PPA"
3. Select the responsible office
4. Choose parent PPA (if creating a child project/activity)
5. Enter PPA name and type
6. Set code suffix (auto-generated based on hierarchy)
7. Mark as active/inactive
8. Save the PPA

#### PPA Hierarchy
- **Program**: Top-level initiative
- **Project**: Specific undertaking under a program
- **Activity**: Detailed task within a project

### PPMP Management

#### Creating PPMP Items
1. Navigate to **PPMP** for a specific AIP entry
2. Click "Add Item"
3. Select from price list or add custom item
4. Enter quantity
5. Allocate monthly quantities (Jan-Dec)
6. Select funding source
7. Save the item

#### Monthly Planning
- Distribute quantities across 12 months
- System automatically calculates monthly amounts
- Adjust quantities based on procurement schedules

### Master Data Configuration

#### Funding Sources
1. Go to **Funding Sources**
2. Add new source with name and description
3. Edit or delete existing sources
4. Sources are used in PPMP allocation

#### Chart of Accounts
1. Access **Chart of Accounts**
2. Add account codes with expense class (PS, MOOE, FE, CO)
3. Link to account groups
4. Accounts are used for budget classification

#### Price Lists
1. Navigate to **Price Lists**
2. Add items with:
   - Description
   - Unit of measurement
   - Unit price
   - Category
   - Chart of account
3. Update prices as needed
4. Items are used in PPMP

#### PPMP Categories
1. Go to **PPMP Categories**
2. Create categories (e.g., Office Supplies, Equipment, Construction)
3. Assign to price list items
4. Categories help organize procurement items

### Organizational Setup

#### Sectors
1. Access **Sectors**
2. Add sector name and code
3. Sectors are used in office classification

#### LGU Levels
1. Go to **LGU Levels**
2. Add levels (e.g., Provincial, City, Municipal, Barangay)
3. Assign codes
4. Levels determine office hierarchy

#### Office Types
1. Navigate to **Office Types**
2. Add office types (e.g., Department, Office, Unit)
3. Assign codes
4. Types classify office functions

#### Offices
1. Go to **Offices**
2. Add office with:
   - Sector
   - LGU Level
   - Office Type
   - Code
   - Name
   - Acronym
   - LEE status (Local Economic Enterprise)
3. System generates full code automatically
4. Offices are assigned to PPAs and users

### User Management (Admin Only)

#### Managing Users
1. Navigate to **Users**
2. View all registered users
3. Approve pending user registrations
4. Update user status (active/inactive)
5. Users must be approved to access the system

## Common Workflows

### Workflow 1: Creating a New Project

1. **Set Up Fiscal Year**: Create the fiscal year for the project
2. **Define Office**: Ensure the responsible office exists
3. **Create PPA**: Add the project to the PPA hierarchy
4. **Add to AIP**: Create an AIP entry for the project
5. **Set Budget**: Allocate budget across expense categories
6. **Create PPMP**: Add procurement items with monthly schedules
7. **Assign Funding**: Link funding sources to items

### Workflow 2: Annual Planning Cycle

1. **Start Fiscal Year**: Create new fiscal year
2. **Review PPAs**: Update project hierarchy and status
3. **Import AIP Entries**: Import projects to AIP
4. **Allocate Budget**: Set budget amounts for each entry
5. **Plan Procurement**: Create PPMP items with monthly schedules
6. **Update Price Lists**: Ensure current prices are reflected
7. **Review and Approve**: Validate all entries before finalization

### Workflow 3: Procurement Scheduling

1. **Select AIP Entry**: Choose the project to plan procurement for
2. **Add PPMP Items**: Select items from price list
3. **Distribute Quantities**: Spread quantities across months
4. **Assign Funding**: Link each item to funding sources
5. **Review Totals**: Verify monthly and annual totals
6. **Export Reports**: Generate procurement schedules

## Data Relationships

Understanding how data connects:

- **Fiscal Year** → contains multiple **AIP Entries**
- **AIP Entry** → linked to one **PPA**
- **PPA** → belongs to one **Office**
- **Office** → belongs to **Sector**, **LGU Level**, **Office Type**
- **AIP Entry** → can have multiple **PPMP Items**
- **PPMP Item** → linked to **Price List** and **Funding Source**
- **Price List** → linked to **Chart of Account** and **PPMP Category**

## Best Practices

### Data Entry
- Use consistent naming conventions
- Validate codes before saving
- Review hierarchy relationships
- Keep price lists updated

### Planning
- Start with fiscal year setup
- Build PPA hierarchy before creating entries
- Use standard price list items when possible
- Distribute procurement realistically across months

### Collaboration
- Coordinate with office heads for PPA creation
- Consult finance team for budget allocations
- Work with procurement team for PPMP scheduling
- Get admin approval for new users

## Troubleshooting

### Common Issues

**Cannot access a module**
- Check your user role and permissions
- Ensure your account is approved by admin
- Contact administrator if issue persists

**Incorrect calculations**
- Verify price list values are correct
- Check funding source allocations
- Review expense class assignments

**Missing data in dropdowns**
- Ensure master data is configured first
- Check if items are marked as active
- Verify proper data relationships

### Getting Help

- Contact your system administrator
- Check for system announcements or updates

## Security Considerations

- Keep your password secure
- Log out when not using the system
- Report suspicious activity to admin
- Only access data relevant to your role

## Glossary

- **AIP (Annual Investment Program)**: The annual slice of the Local Development Investment Program (LDIP) which constitutes the total resource requirements for all PPAs consisting of the annual capital expenditure and regular operating requirements of the LGU
- **PPA (Program/Project/Activity)**: Ranked initiatives that become the bases for preparing annual budget proposals; LGUs establish priorities and allocate resources during investment programming of PPAs as major links to budgeting
- **PPMP (Project Procurement Management Plan)**: The detailed schedule of procurement activities; inclusion of procurement planning in budget preparation adds credibility as costing and programming of implementation are determined as inputs to budget proposals
- **PS (Personal Services)**: Budget allocation for personnel salaries, benefits, and other authorized personnel-related expenses
- **MOOE (Maintenance and Other Operating Expenses)**: Budget for operational costs including demand-driven changes (population, cost of maintaining ideal service level) and budgetary implications of price changes
- **FE (Financial Expenses)**: Budget for financial charges and obligations
- **CO (Capital Outlay)**: Budget for asset acquisition and infrastructure projects
- **LDIP (Local Development Investment Program)**: A basic document linking the local development plan to the budget, containing a prioritized list of PPAs derived from the CDP matched with financing resources to be implemented within a 3-6 year period
- **CDP (Comprehensive Development Plan)**: The multi-sectoral plan formulated at city or municipal level embodying vision, sectoral goals, objectives, development strategies and policies within the terms of LGU officials
- **LGU (Local Government Unit)**: The government entity (Province, City, Municipality) using the system with different taxing powers as prescribed by the Local Government Code
- **LEE (Local Economic Enterprise)**: Business-type operations of LGUs
- **Chart of Accounts**: The Revised Chart of Accounts for LGUs as prescribed under Commission on Audit Circular No. 2015-009

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Valid user account with admin approval
- Appropriate user role for intended tasks
