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
RUN useradd -m -d /home/user -s /bin/bash user

# Set up the workspace
WORKDIR /home/user

# Create sample files for demonstration
RUN mkdir -p /home/user/projects /home/user/tmp \
    && echo "Hello World!" > /home/user/file1.txt \
    && echo "Sample Content" > /home/user/file2.txt \
    && mkdir -p /home/user/projects/demo \
    && echo "console.log('Hello World');" > /home/user/projects/demo/script.js

# Set permissions
RUN chown -R user:user /home/user

# Switch to non-root user
USER user

CMD ["/bin/bash"]