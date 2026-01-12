export interface Task {
    _id: string
    subject: Subject
    theme: string
    difficulty: Difficulty

    title: string
    statement: string
}

export enum Difficulty {
    easy = "Легко",
    medium = "Средне",
    hard = "Сложно"
}

export enum Subject {
    inf = "Информатика",
    mat = "Математика",
    fiz = "Физика",
    rus = "Русский язык"
}
