FROM debian:bullseye-slim

# Install necessary packages
RUN apt-get update && apt-get install -y \
    bash \
    coreutils \
    procps \
    grep \
    less \
    tree \
    nano \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m -d /home/term-user -s /bin/bash term-user

# Set up the workspace
WORKDIR /home/term-user

# Create sample files for demonstration
RUN mkdir -p /home/term-user/projects /home/term-user/tmp \
    && echo "Hello World!" > /home/term-user/file1.txt \
    && echo "Sample Content" > /home/term-user/file2.txt \
    && mkdir -p /home/term-user/projects/demo \
    && echo "console.log('Hello World');" > /home/term-user/projects/demo/script.js

# Set permissions
RUN chown -R term-user:term-user /home/term-user

# Switch to non-root user
USER term-user

CMD ["/bin/bash"]