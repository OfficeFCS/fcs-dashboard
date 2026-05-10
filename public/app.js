// =====================================================
//  Final Cleaning Solutions Inc. — Dashboard Logic
// =====================================================

'use strict';

// =====================================================
//  STATE
//  db.jobs      — array of job objects
//  db.employees — array of employee objects
//  db.pos       — { jobId: {x, y} } whiteboard positions
// =====================================================
let db = { jobs: [], employees: [], pos: {} };

let authToken = localStorage.getItem('fcs-token') || '';

let ejId        = null;  // id of the job currently open in the edit panel
let eeId        = null;  // id of the employee currently open in the edit panel
let dragEmp     = null;  // id of the employee being dragged from the sidebar (desktop)
let wbDrag      = null;  // active whiteboard job-drag state { id, el, sx, sy, ox, oy }
let currentScale = 1;   // current whiteboard zoom level (maintained by zoomToFit)
let currentTx    = 0;   // current canvas translate X (maintained by zoomToFit)
let currentTy    = 0;   // current canvas translate Y (maintained by zoomToFit)
let selectedEmp  = null;  // id of employee selected for tap-to-assign (mobile)

// =====================================================
//  UTILITIES
// =====================================================

const $      = id => document.getElementById(id);
const uid    = () => '_' + Math.random().toString(36).slice(2, 10);
const jobBy  = id => db.jobs.find(j => j.id === id);
const empBy  = id => db.employees.find(e => e.id === id);

// Save the full state to the server (fire-and-forget — UI updates immediately)
const save = () => {
  fetch('/api/state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authToken,
    },
    body: JSON.stringify(db),
  }).catch(err => console.error('Save failed:', err));
};

// Escape HTML to prevent XSS when injecting user data into innerHTML
const esc = s =>
  s ? (s + '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

// =====================================================
//  DATA LOAD — fetches state from the server.
//  Seeds demo data if the server has no saved state yet.
// =====================================================
async function load() {
  try {
    const res  = await fetch('/api/state', {
      headers: { 'Authorization': 'Bearer ' + authToken },
    });
    if (res.status === 401) { window.location.replace('/login.html'); return; }
    const data = await res.json();
    if (data) { db = data; return; }
  } catch (e) {
    console.error('Could not reach server, using empty state:', e);
  }

  // No saved state — seed with demo data and save it to the server
  // --- 2 active jobs ---
  const activeJobs = [
    { id: 'j1', name: 'Downtown Office Complex', con: 'BuildCo Inc',     ph: '555-0101', em: 'build@buildco.com',  ad: '123 Main St',  active: true },
    { id: 'j2', name: 'Riverside Apartments',    con: 'RiverDev LLC',    ph: '555-0202', em: 'info@riverdev.com', ad: '456 River Rd', active: true },
  ];

  // --- 60 inactive jobs ---
  const inactiveJobs = [
    { id: 'j3',  name: 'Harbor View Plaza',             con: 'Harbor Group',       ph: '555-1001', em: 'hv@harborgroup.com',    ad: '10 Harbor Blvd',       active: false },
    { id: 'j4',  name: 'Westfield Shopping Center',     con: 'Westfield Corp',     ph: '555-1002', em: 'ops@westfield.com',     ad: '200 Westfield Dr',     active: false },
    { id: 'j5',  name: 'Northgate Medical Center',      con: 'MedBuild Inc',       ph: '555-1003', em: 'nb@medbuild.com',       ad: '55 Northgate Ave',     active: false },
    { id: 'j6',  name: 'Sunset Hills Elementary',       con: 'School Contractors', ph: '555-1004', em: 'sc@schoolcon.com',      ad: '300 Sunset Blvd',      active: false },
    { id: 'j7',  name: 'Grand Central Hotel',           con: 'Luxury Builds LLC',  ph: '555-1005', em: 'lb@luxurybuilds.com',   ad: '1 Grand Plaza',        active: false },
    { id: 'j8',  name: 'Metro Transit Hub',             con: 'CityWorks Co',       ph: '555-1006', em: 'cw@cityworks.com',      ad: '400 Metro Way',        active: false },
    { id: 'j9',  name: 'Lakeside Corporate Park',       con: 'Lake Develop LLC',   ph: '555-1007', em: 'ld@lakedev.com',        ad: '88 Lakeside Dr',       active: false },
    { id: 'j10', name: 'Pioneer Square Condos',         con: 'Pioneer Props',      ph: '555-1008', em: 'pp@pioneerprop.com',    ad: '12 Pioneer Sq',        active: false },
    { id: 'j11', name: 'Eastgate Warehouse Complex',    con: 'Industrial Builds',  ph: '555-1009', em: 'ib@indbuilds.com',      ad: '900 Eastgate Rd',      active: false },
    { id: 'j12', name: 'Valley Ridge Office Tower',     con: 'Ridge Dev Group',    ph: '555-1010', em: 'rd@ridgedev.com',       ad: '77 Valley Ridge Ln',   active: false },
    { id: 'j13', name: 'Pacific Coast Convention Ctr',  con: 'Coast Builders',     ph: '555-1011', em: 'cb@coastbuilders.com',  ad: '500 Pacific Blvd',     active: false },
    { id: 'j14', name: 'Silver Oak Retirement Home',    con: 'Senior Spaces Inc',  ph: '555-1012', em: 'ss@seniorspaces.com',   ad: '14 Silver Oak Way',    active: false },
    { id: 'j15', name: 'Millbrook Industrial Park',     con: 'Mill Contractors',   ph: '555-1013', em: 'mc@millcon.com',        ad: '350 Millbrook Ave',    active: false },
    { id: 'j16', name: 'Clearwater Community College',  con: 'EduBuild Partners',  ph: '555-1014', em: 'eb@edubuild.com',       ad: '200 College Rd',       active: false },
    { id: 'j17', name: 'Ridgeline Apartment Complex',   con: 'Ridgeline LLC',      ph: '555-1015', em: 'rl@ridgeline.com',      ad: '66 Ridgeline Dr',      active: false },
    { id: 'j18', name: 'Summit Sports Arena',           con: 'Arena Builders',     ph: '555-1016', em: 'ab@arenabuilders.com',  ad: '1 Summit Arena Rd',    active: false },
    { id: 'j19', name: 'Harborside Luxury Condos',      con: 'Harborside Dev',     ph: '555-1017', em: 'hd@harborside.com',     ad: '22 Harbor Point Dr',   active: false },
    { id: 'j20', name: 'Cedar Grove Shopping Mall',     con: 'Grove Properties',   ph: '555-1018', em: 'gp@groveprops.com',     ad: '800 Cedar Grove Blvd', active: false },
    { id: 'j21', name: 'Creekside Elementary School',   con: 'School Contractors', ph: '555-1019', em: 'sc@schoolcon.com',      ad: '101 Creekside Ln',     active: false },
    { id: 'j22', name: 'Mountainview Tech Campus',      con: 'TechBuild Corp',     ph: '555-1020', em: 'tb@techbuild.com',      ad: '500 Mountainview Dr',  active: false },
    { id: 'j23', name: 'Bayside Marina Clubhouse',      con: 'Marina Builds',      ph: '555-1021', em: 'mb@marinabuilds.com',   ad: '9 Bayside Marina Rd',  active: false },
    { id: 'j24', name: 'Sunridge Business Park',        con: 'Sunridge Dev',       ph: '555-1022', em: 'sd@sunridgedev.com',    ad: '300 Sunridge Pkwy',    active: false },
    { id: 'j25', name: 'Oakwood Senior Living',         con: 'Senior Spaces Inc',  ph: '555-1023', em: 'ss@seniorspaces.com',   ad: '45 Oakwood Ln',        active: false },
    { id: 'j26', name: 'Riverside Medical Plaza',       con: 'MedBuild Inc',       ph: '555-1024', em: 'nb@medbuild.com',       ad: '250 Riverside Blvd',   active: false },
    { id: 'j27', name: 'Hilltop Elementary Renovation', con: 'School Contractors', ph: '555-1025', em: 'sc@schoolcon.com',      ad: '77 Hilltop Rd',        active: false },
    { id: 'j28', name: 'Bayshore Hotel & Spa',          con: 'Luxury Builds LLC',  ph: '555-1026', em: 'lb@luxurybuilds.com',   ad: '1 Bayshore Ave',       active: false },
    { id: 'j29', name: 'Crossroads Shopping Center',    con: 'Crossroads Corp',    ph: '555-1027', em: 'cc@crossroadscorp.com', ad: '400 Crossroads Blvd',  active: false },
    { id: 'j30', name: 'Willow Creek Apartments',       con: 'Willow Dev LLC',     ph: '555-1028', em: 'wd@willowdev.com',      ad: '33 Willow Creek Dr',   active: false },
    { id: 'j31', name: 'Northside Community Center',    con: 'CityWorks Co',       ph: '555-1029', em: 'cw@cityworks.com',      ad: '600 Northside Dr',     active: false },
    { id: 'j32', name: 'Heritage Museum Expansion',     con: 'Heritage Builds',    ph: '555-1030', em: 'h@heritage.com',        ad: '1 Museum Plaza',       active: false },
    { id: 'j33', name: 'Lakeview High School',          con: 'EduBuild Partners',  ph: '555-1031', em: 'eb@edubuild.com',       ad: '200 Lakeview Blvd',    active: false },
    { id: 'j34', name: 'Coastal Emergency Center',      con: 'MedBuild Inc',       ph: '555-1032', em: 'nb@medbuild.com',       ad: '50 Coastal Hwy',       active: false },
    { id: 'j35', name: 'Pinecrest Office Complex',      con: 'Pinecrest Dev',      ph: '555-1033', em: 'pd@pinecrestdev.com',   ad: '700 Pinecrest Ave',    active: false },
    { id: 'j36', name: 'Meadowbrook Townhomes',         con: 'Meadow Builders',    ph: '555-1034', em: 'mb@meadowbuild.com',    ad: '88 Meadowbrook Dr',    active: false },
    { id: 'j37', name: 'Riverside Industrial Hub',      con: 'Industrial Builds',  ph: '555-1035', em: 'ib@indbuilds.com',      ad: '1100 Riverside Pkwy',  active: false },
    { id: 'j38', name: 'Clifton Performing Arts Ctr',   con: 'Arts Build Group',   ph: '555-1036', em: 'ag@artsbuild.com',      ad: '5 Clifton Center Dr',  active: false },
    { id: 'j39', name: 'Stonegate Corporate Campus',    con: 'Stonegate Dev',      ph: '555-1037', em: 'sg@stonegatecorp.com',  ad: '900 Stonegate Blvd',   active: false },
    { id: 'j40', name: 'Fairfield Grocery Dist. Ctr',   con: 'Fairfield Builds',   ph: '555-1038', em: 'fb@fairfieldbuilds.com','ad': '300 Fairfield Way',   active: false },
    { id: 'j41', name: 'Eagle Ridge Condominiums',      con: 'Eagle Dev LLC',      ph: '555-1039', em: 'ed@eagledev.com',       ad: '55 Eagle Ridge Rd',    active: false },
    { id: 'j42', name: 'Westwood Elementary School',    con: 'School Contractors', ph: '555-1040', em: 'sc@schoolcon.com',      ad: '200 Westwood Blvd',    active: false },
    { id: 'j43', name: 'Harbor Lights Hotel',           con: 'Luxury Builds LLC',  ph: '555-1041', em: 'lb@luxurybuilds.com',   ad: '10 Harbor Lights Dr',  active: false },
    { id: 'j44', name: 'Ironwood Data Center',          con: 'TechBuild Corp',     ph: '555-1042', em: 'tb@techbuild.com',      ad: '400 Ironwood Pkwy',    active: false },
    { id: 'j45', name: 'Maplewood Civic Center',        con: 'CityWorks Co',       ph: '555-1043', em: 'cw@cityworks.com',      ad: '1 Maplewood Plaza',    active: false },
    { id: 'j46', name: 'Sunset Ridge Apartments',       con: 'Ridge Dev Group',    ph: '555-1044', em: 'rd@ridgedev.com',       ad: '77 Sunset Ridge Ave',  active: false },
    { id: 'j47', name: 'Foxwood Business Park',         con: 'Foxwood Dev',        ph: '555-1045', em: 'fd@foxwooddev.com',     ad: '500 Foxwood Dr',       active: false },
    { id: 'j48', name: 'Greenfield Sports Complex',     con: 'Arena Builders',     ph: '555-1046', em: 'ab@arenabuilders.com',  ad: '200 Greenfield Blvd',  active: false },
    { id: 'j49', name: 'Lakewood Library Expansion',    con: 'EduBuild Partners',  ph: '555-1047', em: 'eb@edubuild.com',       ad: '10 Lakewood Rd',       active: false },
    { id: 'j50', name: 'Brookside Medical Group',       con: 'MedBuild Inc',       ph: '555-1048', em: 'nb@medbuild.com',       ad: '333 Brookside Dr',     active: false },
    { id: 'j51', name: 'Canyon View Shopping Center',   con: 'Canyon Dev Corp',    ph: '555-1049', em: 'cd@canyondev.com',      ad: '600 Canyon View Blvd', active: false },
    { id: 'j52', name: 'Elmwood Senior Center',         con: 'Senior Spaces Inc',  ph: '555-1050', em: 'ss@seniorspaces.com',   ad: '44 Elmwood Way',       active: false },
    { id: 'j53', name: 'Southport Convention Hall',     con: 'Coast Builders',     ph: '555-1051', em: 'cb@coastbuilders.com',  ad: '1 Southport Blvd',     active: false },
    { id: 'j54', name: 'Ridgemont Office Park',         con: 'Ridgemont Dev',      ph: '555-1052', em: 'rm@ridgemontdev.com',   ad: '800 Ridgemont Ave',    active: false },
    { id: 'j55', name: 'Lakeside Elementary School',    con: 'School Contractors', ph: '555-1053', em: 'sc@schoolcon.com',      ad: '120 Lakeside School Dr',active: false },
    { id: 'j56', name: 'Oceanview Luxury Tower',        con: 'Luxury Builds LLC',  ph: '555-1054', em: 'lb@luxurybuilds.com',   ad: '1 Oceanview Terrace',  active: false },
    { id: 'j57', name: 'Northfield Community Hospital', con: 'MedBuild Inc',       ph: '555-1055', em: 'nb@medbuild.com',       ad: '500 Northfield Dr',    active: false },
    { id: 'j58', name: 'Parkside Retail Center',        con: 'Park Properties',    ph: '555-1056', em: 'pp@parkprops.com',      ad: '200 Parkside Blvd',    active: false },
    { id: 'j59', name: 'Timberline Ski Lodge',          con: 'Alpine Builders',    ph: '555-1057', em: 'ab@alpinebuilders.com', ad: '1 Timberline Peak Rd', active: false },
    { id: 'j60', name: 'Clearfield Industrial Complex', con: 'Industrial Builds',  ph: '555-1058', em: 'ib@indbuilds.com',      ad: '700 Clearfield Way',   active: false },
    { id: 'j61', name: 'Hillcrest Country Club',        con: 'Prestige Builders',  ph: '555-1059', em: 'pb@prestigebuilds.com', ad: '1 Hillcrest Club Dr',  active: false },
    { id: 'j62', name: 'Bayside Aquatic Center',        con: 'Arena Builders',     ph: '555-1060', em: 'ab@arenabuilders.com',  ad: '50 Bayside Aquatic Dr',active: false },
  ];

  db.jobs = [...activeJobs, ...inactiveJobs];

  // --- 52 employees (mix of foreman, journeyman, apprentice) ---
  db.employees = [
    // Foremen (8)
    { id: 'e1',  name: 'Carlos Mendez',    ph: '555-2001', lv: 'foreman',    al: null, av: 'available', jid: 'j1' },
    { id: 'e2',  name: 'James Rodriguez',  ph: '555-2002', lv: 'foreman',    al: null, av: 'available', jid: 'j2' },
    { id: 'e3',  name: 'Patricia Williams',ph: '555-2003', lv: 'foreman',    al: null, av: 'available', jid: null },
    { id: 'e4',  name: 'Robert Chen',      ph: '555-2004', lv: 'foreman',    al: null, av: 'available', jid: null },
    { id: 'e5',  name: 'Maria Garcia',     ph: '555-2005', lv: 'foreman',    al: null, av: 'available', jid: null },
    { id: 'e6',  name: 'Thomas Anderson',  ph: '555-2006', lv: 'foreman',    al: null, av: 'available', jid: null },
    { id: 'e7',  name: 'Linda Martinez',   ph: '555-2007', lv: 'foreman',    al: null, av: 'leave',     jid: null },
    { id: 'e8',  name: 'Kevin Thompson',   ph: '555-2008', lv: 'foreman',    al: null, av: 'available', jid: null },
    // Journeymen (16)
    { id: 'e9',  name: 'Sarah Johnson',    ph: '555-2009', lv: 'journeyman', al: null, av: 'available', jid: 'j1' },
    { id: 'e10', name: 'Anthony Davis',    ph: '555-2010', lv: 'journeyman', al: null, av: 'available', jid: 'j2' },
    { id: 'e11', name: 'Nancy Miller',     ph: '555-2011', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e12', name: 'Mark Johnson',     ph: '555-2012', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e13', name: 'Sandra Brown',     ph: '555-2013', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e14', name: 'Christopher Lee',  ph: '555-2014', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e15', name: 'Ashley Taylor',    ph: '555-2015', lv: 'journeyman', al: null, av: 'leave',     jid: null },
    { id: 'e16', name: 'Daniel Harris',    ph: '555-2016', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e17', name: 'Jessica Clark',    ph: '555-2017', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e18', name: 'Matthew Lewis',    ph: '555-2018', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e19', name: 'Amanda Walker',    ph: '555-2019', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e20', name: 'Ryan Hall',        ph: '555-2020', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e21', name: 'Stephanie Allen',  ph: '555-2021', lv: 'journeyman', al: null, av: 'unavailable',jid: null },
    { id: 'e22', name: 'Joshua Young',     ph: '555-2022', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e23', name: 'Rebecca King',     ph: '555-2023', lv: 'journeyman', al: null, av: 'available', jid: null },
    { id: 'e24', name: 'Andrew Scott',     ph: '555-2024', lv: 'journeyman', al: null, av: 'available', jid: null },
    // Apprentices (28)
    { id: 'e25', name: 'Mike Torres',      ph: '555-2025', lv: 'apprentice', al: '3',  av: 'available', jid: 'j2' },
    { id: 'e26', name: 'Brandon Adams',    ph: '555-2026', lv: 'apprentice', al: '1',  av: 'available', jid: null },
    { id: 'e27', name: 'Samantha Baker',   ph: '555-2027', lv: 'apprentice', al: '1',  av: 'available', jid: null },
    { id: 'e28', name: 'Tyler Carter',     ph: '555-2028', lv: 'apprentice', al: '2',  av: 'available', jid: null },
    { id: 'e29', name: 'Megan Collins',    ph: '555-2029', lv: 'apprentice', al: '2',  av: 'available', jid: null },
    { id: 'e30', name: 'Jordan Evans',     ph: '555-2030', lv: 'apprentice', al: '3',  av: 'available', jid: null },
    { id: 'e31', name: 'Brittany Foster',  ph: '555-2031', lv: 'apprentice', al: '3',  av: 'available', jid: null },
    { id: 'e32', name: 'Kyle Griffin',     ph: '555-2032', lv: 'apprentice', al: '4',  av: 'available', jid: null },
    { id: 'e33', name: 'Lauren Hayes',     ph: '555-2033', lv: 'apprentice', al: '4',  av: 'available', jid: null },
    { id: 'e34', name: 'Sean Howard',      ph: '555-2034', lv: 'apprentice', al: '5',  av: 'available', jid: null },
    { id: 'e35', name: 'Kayla Jenkins',    ph: '555-2035', lv: 'apprentice', al: '5',  av: 'available', jid: null },
    { id: 'e36', name: 'Travis Kelly',     ph: '555-2036', lv: 'apprentice', al: '6',  av: 'available', jid: null },
    { id: 'e37', name: 'Amber Long',       ph: '555-2037', lv: 'apprentice', al: '6',  av: 'available', jid: null },
    { id: 'e38', name: 'Corey Morris',     ph: '555-2038', lv: 'apprentice', al: '1',  av: 'available', jid: null },
    { id: 'e39', name: 'Tiffany Nelson',   ph: '555-2039', lv: 'apprentice', al: '2',  av: 'leave',     jid: null },
    { id: 'e40', name: 'Dustin Owens',     ph: '555-2040', lv: 'apprentice', al: '3',  av: 'available', jid: null },
    { id: 'e41', name: 'Vanessa Parker',   ph: '555-2041', lv: 'apprentice', al: '4',  av: 'available', jid: null },
    { id: 'e42', name: 'Cody Quinn',       ph: '555-2042', lv: 'apprentice', al: '5',  av: 'available', jid: null },
    { id: 'e43', name: 'Danielle Reed',    ph: '555-2043', lv: 'apprentice', al: '6',  av: 'available', jid: null },
    { id: 'e44', name: 'Garrett Shaw',     ph: '555-2044', lv: 'apprentice', al: '1',  av: 'available', jid: null },
    { id: 'e45', name: 'Heather Stone',    ph: '555-2045', lv: 'apprentice', al: '2',  av: 'available', jid: null },
    { id: 'e46', name: 'Ian Tucker',       ph: '555-2046', lv: 'apprentice', al: '3',  av: 'available', jid: null },
    { id: 'e47', name: 'Jamie Valdez',     ph: '555-2047', lv: 'apprentice', al: '4',  av: 'available', jid: null },
    { id: 'e48', name: 'Logan Ward',       ph: '555-2048', lv: 'apprentice', al: '5',  av: 'available', jid: null },
    { id: 'e49', name: 'Marissa Wells',    ph: '555-2049', lv: 'apprentice', al: '6',  av: 'available', jid: null },
    { id: 'e50', name: 'Nathan Young',     ph: '555-2050', lv: 'apprentice', al: '1',  av: 'available', jid: null },
    { id: 'e51', name: 'Olivia Cruz',      ph: '555-2051', lv: 'apprentice', al: '2',  av: 'available', jid: null },
    { id: 'e52', name: 'Preston Diaz',     ph: '555-2052', lv: 'apprentice', al: '3',  av: 'available', jid: null },
  ];

  db.pos = { j1: { x: 120, y: 140 }, j2: { x: 500, y: 200 } };
  save();
}

// =====================================================
//  EMPLOYEE HELPERS
// =====================================================

// Short label shown on whiteboard cards (FM / JM / APP 3)
function lvLabel(e) {
  if (e.lv === 'foreman')    return 'FM';
  if (e.lv === 'journeyman') return 'JM';
  return 'APP ' + e.al;
}

// Full text shown in sidebar cards
function lvFull(e) {
  if (e.lv === 'foreman')    return 'Foreman';
  if (e.lv === 'journeyman') return 'Journeyman';
  return 'Apprentice Lvl ' + e.al;
}

// CSS class for level color (orange / blue / yellow)
function lvClass(e) {
  if (e.lv === 'foreman')    return 'lv-fm';
  if (e.lv === 'journeyman') return 'lv-jm';
  return 'lv-app';
}

// Format a date string (YYYY-MM-DD) as "Monday, May 6"
function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return new Date(+y, +m - 1, +day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// Format a time string (HH:MM) as "8:00AM"
function fmtTime(t) {
  if (!t) return '';
  const [h, min] = t.split(':');
  const dt = new Date(); dt.setHours(+h, +min);
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
}

// Sort weight: Foreman < Journeyman < Apprentice 1-6
function lvSort(e) {
  if (e.lv === 'foreman')    return 0;
  if (e.lv === 'journeyman') return 1;
  return 2 + parseInt(e.al || 1);
}

const isActive  = e => !!e.jid && e.av === 'available'; // assigned and working
const isNeutral = e => !e.jid  && e.av === 'available'; // available but unassigned
const isUnavail = e => e.av !== 'available';             // on leave or cannot work

// =====================================================
//  TAB SWITCHING
// =====================================================
function switchTab(t) {
  ['jobs', 'employees'].forEach(x => {
    $('tb-' + x).classList.toggle('on', x === t);
    $('tp-' + x).classList.toggle('on', x === t);
  });
}

// =====================================================
//  SIDEBAR — JOBS LIST
// =====================================================
function renderJobs() {
  const q = ($('srch-j').value || '').toLowerCase();
  let js = [...db.jobs];

  // Filter by search query (name or contractor)
  if (q) js = js.filter(j => j.name.toLowerCase().includes(q) || (j.con || '').toLowerCase().includes(q));

  // Active jobs first, then inactive sorted alphabetically
  js.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  $('jlist').innerHTML = js.map(j => `
    <div class="sc ${j.active ? 'ja' : 'ji'}" onclick="openEditJob('${j.id}')">
      <div class="sn">${esc(j.name)}</div>
      ${j.con ? `<div class="ss">${esc(j.con)}</div>` : ''}
      <div class="badge ${j.active ? 'bg' : 'br'}">${j.active ? '● Active' : '● Inactive'}</div>
    </div>`).join('');
}

// =====================================================
//  SIDEBAR — EMPLOYEES LIST
// =====================================================
function renderEmps() {
  const q = ($('srch-e').value || '').toLowerCase();
  let es = [...db.employees];

  if (q) es = es.filter(e => e.name.toLowerCase().includes(q));

  // Sort order: active → neutral (by class, then alpha) → unavailable
  es.sort((a, b) => {
    const aA = isActive(a),  bA = isActive(b);
    const aN = isNeutral(a), bN = isNeutral(b);
    if (aA !== bA) return aA ? -1 : 1;
    if (!aA && !bA) {
      if (aN !== bN) return aN ? -1 : 1;
      if (aN && bN) {
        const ld = lvSort(a) - lvSort(b);
        if (ld !== 0) return ld;
      }
    }
    return a.name.localeCompare(b.name);
  });

  $('elist').innerHTML = es.map(e => {
    // Border color class
    const cls = isActive(e) ? 'ea' : isUnavail(e) ? 'eu' : 'en';

    // Status badge
    const badge =
      e.av === 'leave'       ? `<div class="badge bp">On Leave</div>` :
      e.av === 'unavailable' ? `<div class="badge bp">Unavailable</div>` :
      isActive(e)            ? `<div class="badge bg">● Working</div>` :
                               `<div class="badge bx">Available</div>`;

    // Only available employees can be dragged to the whiteboard
    const canDrag = e.av === 'available';

    const assignBtn = canDrag
      ? `<button class="assign-btn" onclick="event.stopPropagation();selectEmpToAssign('${e.id}')">+ Assign</button>`
      : '';

    return `<div class="sc ${cls} ${selectedEmp === e.id ? 'sel' : ''}"
      ${canDrag ? `draggable="true" ondragstart="dStart(event,'${e.id}')" ondragend="dEnd(event)"` : ''}
      onclick="openEditEmp('${e.id}')">
      <div class="sn">${esc(e.name)}</div>
      <div class="ss"><span class="${lvClass(e)}">${lvFull(e)}</span></div>
      ${badge}
      ${assignBtn}
    </div>`;
  }).join('');
}

// =====================================================
//  JOB EDIT PANEL
// =====================================================

function openCreateJob() {
  ejId = null;
  $('ep-job-t').textContent = 'New Job';
  ['fj-name', 'fj-con', 'fj-ph', 'fj-em', 'fj-ad', 'fj-sd', 'fj-ed', 'fj-tm'].forEach(id => $(id).value = '');
  $('fj-st').value = 'active';
  $('del-job').style.display = 'none';
  openPanel('ep-job');
}

function openEditJob(id) {
  const j = jobBy(id);
  if (!j) return;
  ejId = id;
  $('ep-job-t').textContent = 'Edit Job';
  $('fj-name').value = j.name || '';
  $('fj-con').value  = j.con  || '';
  $('fj-ph').value   = j.ph   || '';
  $('fj-em').value   = j.em   || '';
  $('fj-ad').value   = j.ad   || '';
  $('fj-sd').value   = j.sd || '';
  $('fj-ed').value   = j.ed || '';
  $('fj-tm').value   = j.tm || '';
  $('fj-st').value   = j.active ? 'active' : 'inactive';
  $('del-job').style.display = '';
  openPanel('ep-job');
}

function saveJob() {
  const name = $('fj-name').value.trim();
  if (!name) { alert('Job name is required.'); return; }
  const active = $('fj-st').value === 'active';

  if (ejId) {
    const j = jobBy(ejId);
    const wasActive = j.active;
    Object.assign(j, {
      name, active,
      con: $('fj-con').value.trim(),
      ph:  $('fj-ph').value.trim(),
      em:  $('fj-em').value.trim(),
      ad:  $('fj-ad').value.trim(),
      sd:  $('fj-sd').value,
      ed:  $('fj-ed').value,
      tm:  $('fj-tm').value,
    });
    // Deactivating a job removes it from the whiteboard and unassigns all employees
    if (wasActive && !active) {
      delete db.pos[ejId];
      db.employees.forEach(e => { if (e.jid === ejId) e.jid = null; });
    }
    // Reactivating a job places it on the whiteboard
    if (!wasActive && active) autoPlace(ejId);
  } else {
    const id = uid();
    db.jobs.push({
      id, name, active,
      con: $('fj-con').value.trim(),
      ph:  $('fj-ph').value.trim(),
      em:  $('fj-em').value.trim(),
      ad:  $('fj-ad').value.trim(),
      sd:  $('fj-sd').value,
      ed:  $('fj-ed').value,
      tm:  $('fj-tm').value,
    });
    if (active) autoPlace(id);
  }

  save(); closePanel(); renderAll();
}

function confirmDelJob() {
  const j = jobBy(ejId);
  if (!confirm(`Delete job "${j?.name}"?\n\nAll employees will be unassigned.`)) return;
  db.jobs = db.jobs.filter(x => x.id !== ejId);
  db.employees.forEach(e => { if (e.jid === ejId) e.jid = null; });
  delete db.pos[ejId];
  save(); closePanel(); renderAll();
}

// Place a newly active job at a random position on the whiteboard
function autoPlace(id) {
  const w = $('wb').offsetWidth  || 800;
  const h = $('wb').offsetHeight || 600;
  db.pos[id] = {
    x: 80 + Math.floor(Math.random() * (w - 280)),
    y: 90 + Math.floor(Math.random() * (h - 240)),
  };
}

// =====================================================
//  EMPLOYEE EDIT PANEL
// =====================================================

function openCreateEmp() {
  eeId = null;
  $('ep-emp-t').textContent = 'New Employee';
  ['fe-name', 'fe-ph'].forEach(id => $(id).value = '');
  $('fe-lv').value = 'foreman';
  $('fe-al').value = '1';
  $('fe-av').value = 'available';
  $('del-emp').style.display = 'none';
  $('fe-asgw').style.display = 'none';
  onLvChange();
  openPanel('ep-emp');
}

function openEditEmp(id) {
  const e = empBy(id);
  if (!e) return;
  eeId = id;
  $('ep-emp-t').textContent = 'Edit Employee';
  $('fe-name').value = e.name || '';
  $('fe-ph').value   = e.ph   || '';
  $('fe-lv').value   = e.lv   || 'foreman';
  $('fe-al').value   = e.al   || '1';
  $('fe-av').value   = e.av   || 'available';
  $('del-emp').style.display = '';

  // Show current job assignment if one exists
  if (e.jid) {
    const j = jobBy(e.jid);
    $('fe-asgw').style.display = '';
    $('fe-asgn').textContent = j ? j.name : 'Unknown';
  } else {
    $('fe-asgw').style.display = 'none';
  }

  onLvChange();
  openPanel('ep-emp');
}

// Show/hide apprentice level selector based on chosen level
function onLvChange() {
  $('fe-alw').style.display = $('fe-lv').value === 'apprentice' ? '' : 'none';
}

// Remove an employee from their current job (called from panel, not whiteboard)
function unassign() {
  if (!eeId) return;
  const e = empBy(eeId);
  if (e) e.jid = null;
  $('fe-asgw').style.display = 'none';
  save(); renderAll();
}

function saveEmp() {
  const name = $('fe-name').value.trim();
  if (!name) { alert('Name is required.'); return; }
  const lv = $('fe-lv').value;
  const al = lv === 'apprentice' ? $('fe-al').value : null;
  const av = $('fe-av').value;

  if (eeId) {
    const e = empBy(eeId);
    Object.assign(e, { name, ph: $('fe-ph').value.trim(), lv, al, av });
    // Unavailable employees are automatically unassigned from any job
    if (av !== 'available') e.jid = null;
  } else {
    db.employees.push({ id: uid(), name, ph: $('fe-ph').value.trim(), lv, al, av, jid: null });
  }

  save(); closePanel(); renderAll();
}

function confirmDelEmp() {
  const e = empBy(eeId);
  if (!confirm(`Delete employee "${e?.name}"?\n\nThis cannot be undone.`)) return;
  db.employees = db.employees.filter(x => x.id !== eeId);
  save(); closePanel(); renderAll();
}

// =====================================================
//  PANEL OPEN / CLOSE
// =====================================================

function openPanel(id) {
  document.querySelectorAll('.ep').forEach(p => p.classList.remove('on'));
  $(id).classList.add('on');
  $('ov').classList.add('on');
}

function closePanel() {
  document.querySelectorAll('.ep').forEach(p => p.classList.remove('on'));
  $('ov').classList.remove('on');
  ejId = null;
  eeId = null;
}

// =====================================================
//  DRAG FROM SIDEBAR → WHITEBOARD
// =====================================================

function dStart(e, empId) {
  dragEmp = empId;
  e.dataTransfer.effectAllowed = 'move';
  $('dhint').style.display = 'block'; // show "drop on a job card" hint
  requestAnimationFrame(() => e.target.style.opacity = '.4');
}

function dEnd(e) {
  dragEmp = null;
  $('dhint').style.display = 'none';
  e.target.style.opacity = '';
  document.querySelectorAll('.wj.gdt').forEach(el => el.classList.remove('gdt'));
}

// Tap-to-assign: select an employee then tap a job card to assign (works on mobile and desktop)
function selectEmpToAssign(empId) {
  selectedEmp = empId;
  const e = empBy(empId);
  const hint = $('assign-hint');
  hint.innerHTML = `Tap a job to assign <strong>${esc(e?.name)}</strong> <button onclick="cancelAssign()">✕ Cancel</button>`;
  hint.style.display = 'block';
  renderEmps(); // re-render to show selected highlight
}

function cancelAssign() {
  selectedEmp = null;
  $('assign-hint').style.display = 'none';
  renderEmps();
}

// =====================================================
//  SIDEBAR TOGGLE (mobile)
// =====================================================
function toggleSidebar() {
  $('sidebar').classList.toggle('open');
  $('sb-ov').classList.toggle('on');
}

function closeSidebar() {
  $('sidebar').classList.remove('open');
  $('sb-ov').classList.remove('on');
}

// =====================================================
//  WHITEBOARD RENDER
// =====================================================

function renderWB() {
  const wbc = $('wbc');
  wbc.innerHTML = '';
  const active = db.jobs.filter(j => j.active);

  active.forEach(job => {
    // Ensure a position exists (e.g. after page reload or reactivation)
    if (!db.pos[job.id]) autoPlace(job.id);
    const { x, y } = db.pos[job.id];
    const emps = db.employees.filter(e => e.jid === job.id);

    // --- Build job card ---
    const jel = document.createElement('div');
    jel.className = 'wj';
    jel.id = 'wbj-' + job.id;
    jel.style.cssText = `left:${x}px;top:${y}px`;
    const dateStr = (job.sd || job.ed)
      ? [fmtDate(job.sd), fmtDate(job.ed)].filter(Boolean).join(' – ')
      : '';
    const metaLine = [dateStr, fmtTime(job.tm)].filter(Boolean).join('  ·  ');
    jel.innerHTML =
      `<div class="wjn">${esc(job.name)}</div>` +
      (job.con ? `<div class="wjc">${esc(job.con)}</div>` : '') +
      (metaLine ? `<div class="wjd">${esc(metaLine)}</div>` : '');

    // Click: if an employee is selected for tap-to-assign, assign them to this job
    jel.addEventListener('click', () => {
      if (!selectedEmp) return;
      const emp = empBy(selectedEmp);
      if (emp && emp.av === 'available') {
        emp.jid = job.id;
        save(); cancelAssign(); renderAll();
      }
    });

    // Mousedown starts a whiteboard drag to reposition the job card (desktop)
    jel.addEventListener('mousedown', e => {
      if (e.button !== 0 || selectedEmp) return; // don't drag while in assign mode
      // Store offset from finger to card top-left in canvas coords
      wbDrag = { id: job.id, el: jel, sx: e.clientX, sy: e.clientY, ox: x, oy: y };
      jel.classList.add('gjd');
      e.preventDefault();
    });

    // Touchstart starts a whiteboard drag to reposition the job card (mobile)
    jel.addEventListener('touchstart', e => {
      if (selectedEmp) return; // tap handled by click event above
      const t = e.touches[0];
      // Store offset from finger to card top-left in canvas coords
      wbDrag = { id: job.id, el: jel, sx: t.clientX, sy: t.clientY, ox: x, oy: y };
      jel.classList.add('gjd');
    }, { passive: true });

    // Dragover / drop: accept employee cards dragged from the sidebar
    jel.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      jel.classList.add('gdt');
    });
    jel.addEventListener('dragleave', () => jel.classList.remove('gdt'));
    jel.addEventListener('drop', e => {
      e.preventDefault();
      jel.classList.remove('gdt');
      if (dragEmp) {
        const emp = empBy(dragEmp);
        if (emp && emp.av === 'available') {
          emp.jid = job.id; // assign employee to this job
          save(); renderAll();
        }
      }
    });

    wbc.appendChild(jel);

    // --- Build employee cards stacked to the right of the job card ---
    emps.forEach((emp, i) => {
      const el = document.createElement('div');
      el.className = 'we' + (emp.av !== 'available' ? ' wlv' : '');
      el.id = 'wbe-' + emp.id;
      el.style.cssText = `left:${x + 190}px;top:${y + i * 62}px`;
      el.innerHTML =
        `<div class="wen">${esc(emp.name)}</div>` +
        `<div class="wel"><span class="${lvClass(emp)}">${lvLabel(emp)}</span></div>`;
      wbc.appendChild(el);
    });
  });

  // Scale and center all active cards, then draw connecting lines
  requestAnimationFrame(() => zoomToFit());
}

// =====================================================
//  SVG CONNECTING LINES
//  Draws dashed lines from the right edge of each job
//  card to the left edge of each assigned employee card.
// =====================================================
function drawLines(active) {
  const svg = $('svg');
  svg.innerHTML = '';
  const wr = $('wb').getBoundingClientRect();

  active.forEach(job => {
    const jel = $('wbj-' + job.id);
    if (!jel) return;
    const jr = jel.getBoundingClientRect();
    const jx = jr.right  - wr.left;
    const jy = jr.top    - wr.top + jr.height / 2;

    db.employees.filter(e => e.jid === job.id).forEach(emp => {
      const eel = $('wbe-' + emp.id);
      if (!eel) return;
      const er = eel.getBoundingClientRect();
      const ex = er.left - wr.left;
          const ey = er.top  - wr.top + er.height / 2;

      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', jx);
      ln.setAttribute('y1', jy);
      ln.setAttribute('x2', ex);
      ln.setAttribute('y2', ey);
      ln.setAttribute('stroke', '#cbd5e1');
      ln.setAttribute('stroke-width', '1.5');
      ln.setAttribute('stroke-dasharray', '5 4');
      svg.appendChild(ln);
    });
  });
}

// =====================================================
//  ZOOM TO FIT
//  Scales and centers #wb-inner so all active job cards
//  and their assigned employees are fully visible.
//  Called after every render and on window resize.
// =====================================================
function zoomToFit() {
  const active = db.jobs.filter(j => j.active);
  const wbEl   = $('wb');
  const hdrEl  = $('wbhdr');
  const inner  = $('wb-inner');

  const wbW  = wbEl.offsetWidth;
  const hdrH = hdrEl.offsetHeight;
  const wbH  = wbEl.offsetHeight - hdrH;

  if (!active.length) {
    currentScale = 1;
    currentTx = 0; currentTy = hdrH;
    inner.style.transformOrigin = '0 0';
    inner.style.transform = `translate(0px, ${hdrH}px) scale(1)`;
    if (!zoomToFit._pending) {
      zoomToFit._pending = true;
      requestAnimationFrame(() => { drawLines(active); zoomToFit._pending = false; });
    }
    return;
  }

  // Bounding box using actual rendered card dimensions
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  active.forEach(job => {
    const pos = db.pos[job.id];
    if (!pos) return;
    const { x, y } = pos;
    const emps = db.employees.filter(e => e.jid === job.id);

    const jel = $('wbj-' + job.id);
    const jW  = jel ? jel.offsetWidth  : 210;
    const jH  = jel ? jel.offsetHeight : 90;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + jW);
    maxY = Math.max(maxY, y + jH);

    emps.forEach((emp, i) => {
      const eel = $('wbe-' + emp.id);
      const eW  = eel ? eel.offsetWidth  : 140;
      const eH  = eel ? eel.offsetHeight : 50;
      maxX = Math.max(maxX, x + 190 + eW);
      maxY = Math.max(maxY, y + i * 62 + eH);
    });
  });

  const pad = 48;
  const contentW = maxX - minX + pad * 2;
  const contentH = maxY - minY + pad * 2;

  // Never zoom in past 100%
  const s  = Math.min(wbW / contentW, wbH / contentH, 1);
  const tx = (wbW - contentW * s) / 2 - (minX - pad) * s;
  const ty = hdrH + (wbH - contentH * s) / 2 - (minY - pad) * s;

  currentScale = s;
  currentTx    = tx;
  currentTy    = ty;

  inner.style.transformOrigin = '0 0';
  inner.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;

  // Guard against queuing multiple rAF callbacks during fast drag events
  if (!zoomToFit._pending) {
    zoomToFit._pending = true;
    requestAnimationFrame(() => {
      drawLines(db.jobs.filter(j => j.active));
      zoomToFit._pending = false;
    });
  }
}

// =====================================================
//  GLOBAL WHITEBOARD DRAG (job card repositioning)
//  Listening on document so dragging outside the card
//  boundary still works smoothly.
// =====================================================
document.addEventListener('mousemove', e => {
  if (!wbDrag) return;
  const { id, el, sx, sy, ox, oy } = wbDrag;
  const nx = Math.max(0, ox + (e.clientX - sx) / currentScale);
  const ny = Math.max(0, oy + (e.clientY - sy) / currentScale);

  el.style.left = nx + 'px';
  el.style.top  = ny + 'px';
  db.pos[id] = { x: nx, y: ny };

  db.employees.filter(x => x.jid === id).forEach((emp, i) => {
    const eel = $('wbe-' + emp.id);
    if (eel) {
      eel.style.left = (nx + 190) + 'px';
      eel.style.top  = (ny + i * 62) + 'px';
    }
  });

  drawLines(db.jobs.filter(j => j.active));
});

document.addEventListener('mouseup', () => {
  if (wbDrag) {
    wbDrag.el.classList.remove('gjd');
    save();
    wbDrag = null;
    zoomToFit(); // re-center view after card is moved
  }
});

// Touch equivalents for job card repositioning on mobile
document.addEventListener('touchmove', e => {
  if (!wbDrag) return;
  e.preventDefault(); // prevent page scroll while dragging a card
  const t = e.touches[0];
  const { id, el, sx, sy, ox, oy } = wbDrag;
  const nx = Math.max(0, ox + (t.clientX - sx) / currentScale);
  const ny = Math.max(0, oy + (t.clientY - sy) / currentScale);

  el.style.left = nx + 'px';
  el.style.top  = ny + 'px';
  db.pos[id] = { x: nx, y: ny };
  db.employees.filter(x => x.jid === id).forEach((emp, i) => {
    const eel = $('wbe-' + emp.id);
    if (eel) {
      eel.style.left = (nx + 190) + 'px';
      eel.style.top  = (ny + i * 62) + 'px';
    }
  });
  drawLines(db.jobs.filter(j => j.active));
}, { passive: false });

document.addEventListener('touchend', () => {
  if (wbDrag) {
    wbDrag.el.classList.remove('gjd');
    save();
    wbDrag = null;
    zoomToFit(); // re-center view after card is moved
  }
});

// =====================================================
//  RENDER ALL + INIT
// =====================================================
function renderAll() {
  renderJobs();
  renderEmps();
  renderWB();
}

// Re-zoom and redraw whenever the window is resized
window.addEventListener('resize', () => zoomToFit());

function signOut() {
  localStorage.removeItem('fcs-token');
  window.location.replace('/login.html');
}

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Load from server first, then render
// If token is missing or invalid, load() redirects to login.html
load().then(() => renderAll());

// Re-fetch data from the server every 10 minutes so the board stays current
// without anyone needing to manually refresh the page
setInterval(async () => {
  await load();
  renderAll();
}, 5 * 60 * 1000);
