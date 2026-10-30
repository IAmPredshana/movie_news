CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url    VARCHAR(500) NOT NULL DEFAULT '/uploads/avatars/default-avatar.png',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    role          SMALLINT     NOT NULL DEFAULT 0 CHECK (role IN (0, 1))
);

CREATE TABLE IF NOT EXISTS articles (
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(100) NOT NULL,
    content    TEXT NOT NULL,
    image_url  VARCHAR(500),
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
    id    SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS article_tags (
    tag_id     INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    PRIMARY KEY (tag_id, article_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id         SERIAL PRIMARY KEY,
    content    TEXT NOT NULL,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS like_articles (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id             SERIAL PRIMARY KEY,
    subscriber_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (subscriber_id, target_user_id)
);

CREATE TABLE IF NOT EXISTS events (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    event_time  TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);