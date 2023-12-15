// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract GradingSystem is ERC721URIStorage {
    error GradingSystem__AdminOnly();

    enum courseSemester {
        ODD,
        EVEN
    }

    enum courseMarksLockedState {
        LOCKED,
        OPEN
    }

    enum accountType {
        STUDENT,
        FACULTY,
        ADMIN
    }

    struct Student {
        string name;
        string branch;
        string uid;
        uint256 batch;
        string email;
        string phone;
        uint256 cgpa;
        uint256[] sgpa;
        uint256[] scorecards;
        uint256 currentSemester;
        string[][] semCourses;
    }

    struct Course {
        string courseId;
        string courseCode;
        string courseName;
        uint256 year;
        courseSemester semester;
        uint256 theoryCredits;
        uint256 labCredits;
        uint256 theoryISEWeightage;
        uint256 theoryMSEWeightage;
        uint256 theoryESEWeightage;
        uint256 labISEWeightage;
        uint256 labMSEWeightage;
        uint256 labESEWeightage;
        uint256 saScore;
        courseMarksLockedState areMarksLocked;
        string[] students;
    }

    uint256 private s_tokenCounter;
    mapping(string => Student) private s_students;
    mapping(uint256 => mapping(string => string[])) private s_studentIds;
    mapping(string => Course) private s_courses;
    string[] private s_courseIds;
    mapping(string => mapping(string => uint256)) private s_courseMarks;
    mapping(address => accountType) private s_userTypes;
    mapping(string => string[]) private s_courseStudents;

    modifier onlyAdmin() {
        if (s_userTypes[msg.sender] != accountType.ADMIN) {
            revert GradingSystem__AdminOnly();
        }
        _;
    }

    constructor() ERC721("Grading System", "Scorecard") {
        s_tokenCounter = 0;
    }

    function addStudent(
        string calldata _uid,
        string calldata _name,
        string calldata _branch,
        uint256 _currentSemester,
        uint256 _batch,
        string calldata _phone,
        string calldata _email
    ) external {
        Student memory _newStudent = Student({
            uid: _uid,
            name: _name,
            branch: _branch,
            currentSemester: _currentSemester,
            cgpa: 0,
            sgpa: new uint256[](8),
            scorecards: new uint256[](8),
            semCourses: new string[][](0),
            batch: _batch,
            email: _email,
            phone: _phone
        });
        s_students[_uid] = _newStudent;
        s_studentIds[_batch][_branch].push(_uid);
    }

    function addCourse(
        string calldata _courseId,
        string calldata _courseCode,
        string calldata _courseName,
        uint256 _year,
        uint256 _semester,
        uint256 _theoryCredits,
        uint256 _labCredits,
        uint256 _theoryISEWeightage,
        uint256 _theoryMSEWeightage,
        uint256 _theoryESEWeightage,
        uint256 _labISEWeightage,
        uint256 _labMSEWeightage,
        uint256 _labESEWeightage
    ) external {
        Course memory _newCourse = Course({
            courseId: _courseId,
            courseCode: _courseCode,
            courseName: _courseName,
            year: _year,
            semester: courseSemester(_semester),
            theoryCredits: _theoryCredits,
            labCredits: _labCredits,
            theoryISEWeightage: _theoryISEWeightage,
            theoryMSEWeightage: _theoryMSEWeightage,
            theoryESEWeightage: _theoryESEWeightage,
            labISEWeightage: _labISEWeightage,
            labMSEWeightage: _labMSEWeightage,
            labESEWeightage: _labESEWeightage,
            saScore: 90,
            areMarksLocked: courseMarksLockedState.OPEN,
            students: new string[](0)
        });
        s_courses[_courseId] = _newCourse;
        s_courseIds.push(_courseId);
    }

    function addCourseToStudent(
        string calldata _uid,
        uint256 _semester,
        string calldata _courseId
    ) external {
        s_students[_uid].semCourses[_semester - 1].push(_courseId);
        s_courses[_courseId].students.push(_uid);
    }

    function addCourseMarks(
        string calldata _uid,
        string calldata _courseId,
        uint256 _marks
    ) external {
        s_courseMarks[_uid][_courseId] = _marks;
    }

    function addSGPA(
        string calldata _uid,
        uint256 _semester,
        uint256 _sgpa
    ) external {
        s_students[_uid].sgpa[_semester] = _sgpa;
    }

    function updateCGPA(string calldata _uid, uint256 _cgpa) external {
        s_students[_uid].cgpa = _cgpa;
    }

    function uploadScorecard(
        string calldata _uid,
        uint256 _semester,
        string memory _scorecardURI
    ) external {
        _safeMint(msg.sender, s_tokenCounter);
        _setTokenURI(s_tokenCounter, _scorecardURI);

        s_students[_uid].scorecards[_semester] = s_tokenCounter;

        s_tokenCounter++;
    }

    function lockCourseMarks(string calldata _courseId) external onlyAdmin {
        s_courses[_courseId].areMarksLocked = courseMarksLockedState
            .LOCKED;
    }

    function getStudent(
        string calldata _uid
    ) external view returns (Student memory) {
        return s_students[_uid];
    }

    function getStudents(
        uint256 _batch,
        string memory _branch
    ) external view returns (string[] memory) {
        return s_studentIds[_batch][_branch];
    }

    function getCourses() external view returns (string[] memory) {
        return s_courseIds;
    }

    function getStudentCourseMarks(
        string calldata _uid,
        string calldata _courseId
    ) external view returns (uint256) {
        return s_courseMarks[_uid][_courseId];
    }

    function getCourseDetails(
        string calldata _courseId
    ) external view returns (Course memory) {
        return s_courses[_courseId];
    }
}
