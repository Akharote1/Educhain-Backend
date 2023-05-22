export function calculateWeightedScore(student, course) {
  const theoryScore = (student.score_theory_ise || 0) + (student.score_theory_mse || 0) + (student.score_theory_ese || 0);
  const labScore = (student.score_lab_ise || 0) + (student.score_lab_mse || 0) + (student.score_lab_ese || 0);
  const totalScore = (theoryScore * course.credits_theory + labScore * course.credits_lab) / (course.credits_theory + course.credits_lab);

  return totalScore;
}

export function calculateMedian(students, course) {
  if (students.length == 0) return 0;
  return students.map(x => calculateWeightedScore(x, course)).sort().slice(Math.floor(students.length / 2), Math.floor(students.length / 2) + 1)[0];
}

export function calculateAbsoluteGrades(students, course) {
  const studentGrades = students.map(student => student.toObject ? student.toObject() : ({...student}))

  studentGrades.forEach(student => {
    const score = calculateWeightedScore(student, course);

    if (score > 85) student.grade = 'AA';
    else if (score > 70) student.grade = 'AB';
    else if (score > 60) student.grade = 'BB';
    else if (score > 55) student.grade = 'BC';
    else if (score > 50) student.grade = 'CC';
    else if (score > 45) student.grade = 'CD';
    else if (score > 40) student.grade = 'DD';
    else student.grade = 'NG';
    
    if (student.flag_not_present) student.grade = 'NP';
    if (student.flag_defaulter) student.grade = 'X';
  })

  return studentGrades;
}

export function calculateGrades(students, course) {
  if (['hss', 'seva-satva'].includes(course.course_type)) {
    return calculateAbsoluteGrades(students, course);
  }

  const median = calculateMedian(students, course);
  const mb2 = median / 2;
  const saValue = course.sa_score;
  const interval = (saValue - mb2) / 6;
  const studentGrades = students.map(student => student.toObject ? student.toObject() : ({...student}))
  
  studentGrades.forEach(student => {
    const score = calculateWeightedScore(student, course);

    if (score > saValue) {
      student.grade = 'AA';
    } else if (score >= mb2 + 5 * interval) {
      student.grade = 'AB'
    } else if (score >= mb2 + 4 * interval) {
      student.grade = 'BB'
    } else if (score >= mb2 + 3 * interval) {
      student.grade = 'BC'
    } else if (score >= mb2 + 2 * interval) {
      student.grade = 'CC'
    } else if (score >= mb2 + 1 * interval) {
      student.grade = 'CD'
    } else if (score >= mb2) {
      student.grade = 'DD'
    } else {
      student.grade = 'FF'
    }

    if (student.flag_not_present) student.grade = 'NP';
    if (student.flag_defaulter) student.grade = 'X';
  })

  return studentGrades;
}

export function getGradePoints(grade) {
  return {
    AA: 10,
    AB: 9,
    BB: 8,
    BC: 7,
    CC: 6,
    CD: 5,
    DD: 4,
    FF: 0,
    NG: 0,
    NP: 0,
    X: 0
  }[grade];
}