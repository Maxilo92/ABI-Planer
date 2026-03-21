
const fs = require('fs');
const path = require('path');

// Basic gender mapping based on the provided first names
const femaleNames = new Set([
  'Verena', 'Nanett', 'Viola', 'Anke', 'Susann', 'Gabriele', 'Heike', 'Katrin', 'Jenny', 'Alin', 
  'Eugenia', 'Silvina', 'Melanie', 'Jessica', 'Vera', 'Gudrun', 'Lisa', 'Lydia', 'Ariunzul', 
  'Christiane', 'Marlen', 'Anka', 'Maria', 'Anna-Lena', 'Manuela', 'Ines', 'Tatjana', 'Ina', 
  'Daniela', 'Maryna', 'Kelly', 'Stefanie', 'Tina', 'Steffi', 'Annamaria', 'Antje', 'Irene', 
  'Jana', 'Kerstin', 'Simone', 'Lia', 'Victoria', 'Karsta', 'Claudia', 'Monique', 
  'Julia-Katharina', 'Jennifer', 'Manja', 'Carsta', 'Sarah', 'Sandy', 'Karin', 'Brigitte', 
  'Christin', 'Eva', 'Jasmin', 'Elisabeth', 'Doris', 'Sina', 'Marie-Josephine', 'Loreen', 
  'Laura', 'Maria Katrin'
]);

const maleNames = new Set([
  'Andreas', 'Sven', 'Rainer', 'Marcel', 'Jens-Uwe', 'Martin', 'Stefan', 'Josias', 'Sebastian', 
  'Ronny', 'Uwe', 'Michael', 'Tino', 'Robert', 'Ludwig', 'Thomas', 'Frank', 'Claas', 'Justin', 
  'Max', 'Oliver', 'John', 'Mario', 'Maximilian', 'Domenik', 'Lars', 'Tobias', 'Falk', 'Mateo', 
  'Steven', 'Alexander'
]);

function getSalutation(firstName) {
  const cleanName = firstName.replace('Dr. ', '').replace('Dr. Mateo', 'Mateo').split(' ')[0];
  if (femaleNames.has(cleanName)) return 'Frau';
  if (maleNames.has(cleanName)) return 'Herr';
  return 'Herr/Frau'; // Fallback
}

const csvData = fs.readFileSync('/Users/maximilian/Documents/Code/Lehrernamen/lehrer_liste.csv', 'utf8');
const lines = csvData.split('\n').filter(line => line.trim() !== '');
const header = lines[0];
const teacherLines = lines.slice(1);

const teachers = [];
const seenNames = new Set();

teacherLines.forEach(line => {
  const [firstName, lastName] = line.split(',');
  if (!lastName) return; // Skip incomplete lines

  const salutation = getSalutation(firstName);
  const fullName = `${salutation} ${lastName.trim()}`;
  
  // Basic slug generation
  const id = fullName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  if (!seenNames.has(id)) {
    teachers.push({ id, name: fullName, avg_rating: 0, vote_count: 0 });
    seenNames.add(id);
  }
});

console.log(JSON.stringify(teachers, null, 2));
