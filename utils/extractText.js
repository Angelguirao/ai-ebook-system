const EPub = require("epub");
const fs = require("fs").promises;

const extractTextFromEPUB = async (filePath) => {
    try {
        console.log(`Checking if file exists at path: ${filePath}`);
        await fs.access(filePath); // Ensure the file exists
        console.log(`File exists at path: ${filePath}`);

        return new Promise((resolve, reject) => {
            console.log(`Initializing EPub with file path: ${filePath}`);
            const epub = new EPub(filePath);

            epub.on("error", (error) => {
                console.error(`EPub error: ${error}`);
                reject(error);
            });

            epub.on("end", async () => {
                try {
                    console.log(`EPub parsing completed. Extracting chapters...`);
                    const chapterPromises = epub.flow.map(
                        (chapter) =>
                            new Promise((resolve, reject) => {
                                epub.getChapter(chapter.id, (err, text) => {
                                    if (err) {
                                        console.error(`Error getting chapter ${chapter.id}: ${err}`);
                                        reject(err);
                                    } else {
                                        console.log(`Chapter ${chapter.id} extracted successfully`);
                                        resolve(text);
                                    }
                                });
                            })
                    );

                    const chapters = await Promise.all(chapterPromises);
                    console.log(`All chapters extracted successfully`);
                    resolve(chapters.join("\n\n"));
                } catch (error) {
                    console.error(`Error during chapter extraction: ${error}`);
                    reject(error);
                }
            });

            console.log(`Starting EPub parsing`);
            epub.parse();
        });
    } catch (error) {
        console.error(`Failed to extract text: ${error.message}`);
        throw new Error(`Failed to extract text: ${error.message}`);
    }
};

module.exports = { extractTextFromEPUB };