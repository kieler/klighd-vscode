(echo -application & echo de.cau.cs.kieler.language.server.LanguageServer & echo -noSplash) > tempFile.temp
type language-server\kieler.ini >> tempFile.temp
type tempFile.temp > language-server\kieler.ini
mkdir keith\dist