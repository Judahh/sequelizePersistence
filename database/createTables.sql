CREATE TABLE IF NOT EXISTS Tests (
        id varchar(24) NOT NULL,
        CONSTRAINT Tests_PK PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS Objects (
        id varchar(24) NOT NULL,
        test VARCHAR(100),
        testNumber INTEGER,
        CONSTRAINT Objects_PK PRIMARY KEY (id)
);
